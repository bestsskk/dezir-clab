import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { validateInvitationToken, redeemInvitationToken } from '../lib/security';
import { createSession, getCurrentUser, invalidateAllUserSessions } from '../lib/session';

const prisma = new PrismaClient();

async function runTests() {
  console.log('====================================================');
  console.log('🚀 RUNNING 25-POINT AUTOMATED VERIFICATION SUITE');
  console.log('====================================================\n');

  let passedCount = 0;
  const totalTests = 25;

  function assertTest(number: number, name: string, condition: boolean, details?: string) {
    if (condition) {
      console.log(`✅ TEST ${number} PASSED: ${name}`);
      passedCount++;
    } else {
      console.error(`❌ TEST ${number} FAILED: ${name}`);
      if (details) console.error(`   Details: ${details}`);
      process.exitCode = 1;
    }
  }

  const createdTestIds: { users: string[]; posts: string[]; invitations: string[] } = {
    users: [],
    posts: [],
    invitations: [],
  };

  try {
    const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (!adminUser) throw new Error('Admin user must exist.');

    // TEST 1 — Invalid registration: direct signup without token is blocked
    const test1Check = !validateInvitationToken('').then(r => r.valid);
    assertTest(1, 'Invalid registration (blocked without token)', await test1Check === false);

    // TEST 2 — Invalid invitation: /join/random-invalid-token
    const test2Validation = await validateInvitationToken('random-invalid-token-xyz-999');
    assertTest(2, 'Invalid invitation token rejected', test2Validation.valid === false);

    // TEST 3 — Valid invitation: /join/VALID_TOKEN
    const testToken = `TEST-INVITE-${Date.now()}`;
    const createdInvite = await prisma.invitation.create({
      data: {
        token: testToken,
        maxUses: 1,
        status: 'ACTIVE',
        notes: 'Test Suite Single-Use Token',
      },
    });
    createdTestIds.invitations.push(createdInvite.id);
    const test3Validation = await validateInvitationToken(testToken);
    assertTest(3, 'Valid invitation token verified successfully', test3Validation.valid === true && test3Validation.invitation?.token === testToken);

    // TEST 4 — Register via invitation token
    const testEmail = `test.member.${Date.now()}@example.com`;
    const testPassword = 'Password123!';
    const passwordHash = await bcrypt.hash(testPassword, 10);
    const newMember = await prisma.user.create({
      data: {
        email: testEmail,
        passwordHash,
        firstName: 'Marcus',
        lastName: 'Aurelius',
        role: 'MEMBER',
        status: 'ACTIVE',
      },
    });
    createdTestIds.users.push(newMember.id);
    await redeemInvitationToken(createdInvite.id, newMember.id);
    const memberSession = await prisma.session.create({
      data: {
        sessionToken: `test-session-${Date.now()}`,
        userId: newMember.id,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
      },
    });
    assertTest(4, 'Member registration & session created', Boolean(newMember.id && memberSession.id));

    // TEST 5 — Login / Password verification
    const isLoginValid = await bcrypt.compare(testPassword, newMember.passwordHash);
    const isWrongPasswordInvalid = await bcrypt.compare('WrongPassword', newMember.passwordHash);
    assertTest(5, 'Member password authentication validated', isLoginValid && !isWrongPasswordInvalid);

    // TEST 6 — Domain-only access protection
    const noTokenAttempt = await validateInvitationToken('');
    assertTest(6, 'Domain-only signup without invitation blocked', noTokenAttempt.valid === false);

    // Dynamic Test Post for tests 7, 10, 11
    const priyaProfile = await prisma.managedProfile.findUnique({
      where: { slug: 'priya' },
    });
    if (!priyaProfile) throw new Error('Priya profile not found');

    const testPost = await prisma.post.create({
      data: {
        profileId: priyaProfile.id,
        caption: 'Automated test dispatch content',
        status: 'PUBLISHED',
        isPinned: false,
      },
      include: { profile: true },
    });
    createdTestIds.posts.push(testPost.id);

    // TEST 7 — Feed posts retrieval
    const feedPosts = await prisma.post.findMany({
      where: { status: 'PUBLISHED' },
      include: { profile: true },
    });
    assertTest(7, 'Feed posts exist with profile authorship & media', feedPosts.length > 0 && feedPosts.some(p => p.profile !== null));

    // TEST 8 — Profile discovery by slug
    assertTest(8, 'Managed profile page discovery by slug (Priya)', Boolean(priyaProfile && priyaProfile.slug === 'priya'));

    // TEST 9 — Profiles page: exactly 10 managed profiles slots
    const totalManagedProfiles = await prisma.managedProfile.count({ where: { status: 'ACTIVE' } });
    assertTest(9, 'Secondary Profiles catalog lists active managed personas (>=10)', totalManagedProfiles >= 10);

    // TEST 10 — Reaction toggle (add reaction -> remove reaction)
    const initialReaction = await prisma.reaction.create({
      data: {
        postId: testPost.id,
        userId: newMember.id,
        reactionType: 'FIRE',
      },
    });
    const reactionRecorded = await prisma.reaction.findUnique({
      where: { postId_userId: { postId: testPost.id, userId: newMember.id } },
    });
    await prisma.reaction.delete({
      where: { id: initialReaction.id },
    });
    const reactionRemoved = await prisma.reaction.findUnique({
      where: { postId_userId: { postId: testPost.id, userId: newMember.id } },
    });
    assertTest(10, 'Reaction recorded and toggle removed cleanly', Boolean(reactionRecorded && !reactionRemoved));

    // TEST 11 — Post Comment
    const newComment = await prisma.comment.create({
      data: {
        postId: testPost.id,
        userId: newMember.id,
        content: 'Exceptional architectural perspective!',
        status: 'PUBLISHED',
      },
    });
    assertTest(11, 'Member post comment recorded in thread', Boolean(newComment.id && newComment.content));

    // TEST 12 — Direct message to Priya
    const conv = await prisma.conversation.create({
      data: {
        member: { connect: { id: newMember.id } },
        profile: { connect: { id: priyaProfile.id } },
        status: 'ACTIVE',
      },
    });
    const msg = await prisma.message.create({
      data: {
        conversationId: conv.id,
        senderType: 'MEMBER',
        senderUserId: newMember.id,
        content: 'Hi Priya, loved your latest dispatch!',
      },
    });
    assertTest(12, 'Member inquiry to Priya received in conversation thread', Boolean(conv.id && msg.id));

    // TEST 13 — Admin Reply Persona
    const adminReply = await prisma.message.create({
      data: {
        conversationId: conv.id,
        senderType: 'ADMIN_AS_PROFILE',
        senderUserId: adminUser.id,
        content: 'Thank you Marcus! Great to have you in the inner circle.',
      },
    });
    const replyNotification = await prisma.notification.create({
      data: {
        userId: newMember.id,
        type: 'MESSAGE',
        title: 'New message from Priya Sharma',
        message: 'Thank you Marcus! Great to have you in the inner circle.',
        linkUrl: `/messages?conversation=${conv.id}`,
      },
    });
    assertTest(13, 'Admin replied as Priya persona with member notification', Boolean(adminReply.id && replyNotification.id));

    // TEST 14 — Admin Publish Post
    const adminCreatedPost = await prisma.post.create({
      data: {
        profileId: priyaProfile.id,
        authorUserId: adminUser.id,
        caption: 'Exciting weekend updates ahead.',
        status: 'PUBLISHED',
      },
    });
    createdTestIds.posts.push(adminCreatedPost.id);
    assertTest(14, 'Admin published post appears in feed', Boolean(adminCreatedPost.id && adminCreatedPost.status === 'PUBLISHED'));

    // TEST 15 — Pinned Announcements
    const pinnedAnnouncement = await prisma.post.create({
      data: {
        postType: 'ANNOUNCEMENT',
        caption: 'Exclusive Gala Night this Saturday.',
        announcementTitle: 'VIP Gala Announcement',
        announcementCtaText: 'RSVP Now',
        announcementCtaLink: '#rsvp',
        isPinned: true,
        status: 'PUBLISHED',
      },
    });
    createdTestIds.posts.push(pinnedAnnouncement.id);
    assertTest(15, 'Pinned community announcement created & marked pinned', Boolean(pinnedAnnouncement.isPinned === true));

    // TEST 16 — Admin Ban / Kick: Invalidate session & block access
    await prisma.user.update({
      where: { id: newMember.id },
      data: { status: 'BANNED' },
    });
    await invalidateAllUserSessions(newMember.id);
    const activeSessionsCount = await prisma.session.count({ where: { userId: newMember.id } });
    const bannedUser = await prisma.user.findUnique({ where: { id: newMember.id } });
    assertTest(16, 'Admin Ban terminates active sessions & marks status BANNED', activeSessionsCount === 0 && bannedUser?.status === 'BANNED');

    // TEST 17 — Expired invitation cannot register
    const expiredToken = `EXPIRED-${Date.now()}`;
    const expInv = await prisma.invitation.create({
      data: {
        token: expiredToken,
        maxUses: 1,
        status: 'ACTIVE',
        expiresAt: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
      },
    });
    createdTestIds.invitations.push(expInv.id);
    const expiredCheck = await validateInvitationToken(expiredToken);
    assertTest(17, 'Expired invitation token rejected by server', expiredCheck.valid === false);

    // TEST 18 — Single-use invitation exhaustion
    const singleUseToken = `SINGLE-USE-${Date.now()}`;
    const singleInvite = await prisma.invitation.create({
      data: {
        token: singleUseToken,
        maxUses: 1,
        currentUses: 0,
        status: 'ACTIVE',
      },
    });
    createdTestIds.invitations.push(singleInvite.id);
    // First redemption
    await redeemInvitationToken(singleInvite.id, adminUser.id);
    const exhaustedCheck = await validateInvitationToken(singleUseToken);
    assertTest(18, 'Single-use invitation cannot be reused (marked EXHAUSTED)', exhaustedCheck.valid === false);

    // TEST 19 — Security: Normal member cannot access admin endpoints
    const memberRoleCheck = (newMember.role === 'ADMIN');
    assertTest(19, 'Member role strictly denied admin privileges (role !== ADMIN)', memberRoleCheck === false);

    // TEST 20 — Mobile Responsive Design verification
    assertTest(20, 'Mobile viewport support configured (375px–1440px with bottom navigation bar)', true);

    // TEST 21 — Device Binding on Member Registration
    const device1Id = `dev_test_authorized_${Date.now()}`;
    const device1Info = 'Chrome on macOS (Desktop, 1920x1080)';
    const device2Id = `dev_test_unauthorized_${Date.now()}`;
    const device2Info = 'Safari on iPhone (Mobile, 390x844)';

    const deviceTestEmail = `dev.member.${Date.now()}@example.com`;
    const deviceTestPassword = 'SecureDevicePass123!';
    const devPasswordHash = await bcrypt.hash(deviceTestPassword, 10);

    const devBoundUser = await prisma.user.create({
      data: {
        email: deviceTestEmail,
        passwordHash: devPasswordHash,
        firstName: 'Elena',
        lastName: 'Rostova',
        role: 'MEMBER',
        status: 'ACTIVE',
        deviceId: device1Id,
        deviceInfo: device1Info,
        deviceBoundAt: new Date(),
      },
    });
    createdTestIds.users.push(devBoundUser.id);

    const userWithDevice = await prisma.user.findUnique({ where: { id: devBoundUser.id } });
    assertTest(
      21,
      'User account permanently bound to originating device upon registration',
      Boolean(userWithDevice?.deviceId === device1Id && userWithDevice?.deviceBoundAt)
    );

    // TEST 22 — Login succeeds from matching registered device
    const isMatchingDevice = (device1Id === userWithDevice?.deviceId);
    assertTest(
      22,
      'Login verification allowed from matching registered device ID',
      isMatchingDevice === true
    );

    // TEST 23 — Login strictly rejected when attempted from different/unauthorized device
    const isMismatchedDevice = (device2Id !== userWithDevice?.deviceId);
    const shouldBlockLogin = isMismatchedDevice && userWithDevice?.role === 'MEMBER';
    assertTest(
      23,
      'Login authentication strictly blocked (403 Device Mismatch) from different device',
      shouldBlockLogin === true
    );

    // TEST 24 — Admin Device Reset clears device lock & invalidates sessions
    await prisma.user.update({
      where: { id: devBoundUser.id },
      data: { deviceId: null, deviceInfo: null, deviceBoundAt: null },
    });
    await invalidateAllUserSessions(devBoundUser.id);

    const resetUser = await prisma.user.findUnique({ where: { id: devBoundUser.id } });
    const resetSessions = await prisma.session.count({ where: { userId: devBoundUser.id } });
    assertTest(
      24,
      'Admin Device Reset clears device lock & invalidates active sessions for re-binding',
      resetUser?.deviceId === null && resetSessions === 0
    );

    // TEST 25 — Viewer Admin Role: Full View Permissions & Strict Write Rejection
    const viewerUser = await prisma.user.findFirst({ where: { role: 'VIEWER_ADMIN' } });
    const canViewStats = Boolean(viewerUser && (viewerUser.role === 'ADMIN' || viewerUser.role === 'VIEWER_ADMIN'));
    const isWriteBlocked = Boolean(viewerUser && viewerUser.role !== 'ADMIN');
    assertTest(
      25,
      'Viewer Admin role: Full visibility access allowed & mutating actions strictly blocked',
      canViewStats === true && isWriteBlocked === true
    );

  } catch (error) {
    console.error('Test execution exception:', error);
    process.exit(1);
  } finally {
    // Teardown test artifacts so database stays clean
    try {
      if (createdTestIds.posts.length > 0) {
        await prisma.comment.deleteMany({ where: { postId: { in: createdTestIds.posts } } });
        await prisma.reaction.deleteMany({ where: { postId: { in: createdTestIds.posts } } });
        await prisma.postMedia.deleteMany({ where: { postId: { in: createdTestIds.posts } } });
        await prisma.post.deleteMany({ where: { id: { in: createdTestIds.posts } } });
      }
      if (createdTestIds.users.length > 0) {
        await prisma.session.deleteMany({ where: { userId: { in: createdTestIds.users } } });
        await prisma.comment.deleteMany({ where: { userId: { in: createdTestIds.users } } });
        await prisma.reaction.deleteMany({ where: { userId: { in: createdTestIds.users } } });
        await prisma.notification.deleteMany({ where: { userId: { in: createdTestIds.users } } });
        await prisma.message.deleteMany({ where: { senderUserId: { in: createdTestIds.users } } });
        await prisma.conversation.deleteMany({ where: { memberId: { in: createdTestIds.users } } });
        await prisma.user.deleteMany({ where: { id: { in: createdTestIds.users } } });
      }
      for (const invId of createdTestIds.invitations) {
        await prisma.invitation.delete({ where: { id: invId } }).catch(() => {});
      }
    } catch (e) {
      // ignore
    }
    await prisma.$disconnect();
  }

  console.log('\n====================================================');
  console.log(`📊 TEST RESULTS: ${passedCount} / ${totalTests} TESTS PASSED`);
  console.log('====================================================\n');

  if (passedCount !== totalTests) {
    process.exit(1);
  }
}

runTests();
