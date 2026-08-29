import os
import shutil
import zipfile

def create_zip():
    target_zip = "/Users/amit/community/dezir-clab-deployment.zip"
    source_dir = "/Users/amit/community"
    
    # 1. Pre-sync standalone assets
    standalone_dir = os.path.join(source_dir, ".next", "standalone")
    if os.path.exists(standalone_dir):
        # Sync .next/static -> .next/standalone/.next/static
        static_src = os.path.join(source_dir, ".next", "static")
        static_dest = os.path.join(standalone_dir, ".next", "static")
        if os.path.exists(static_src):
            if os.path.exists(static_dest):
                shutil.rmtree(static_dest)
            shutil.copytree(static_src, static_dest)
            print("Pre-synced: .next/static -> .next/standalone/.next/static")
            
        # Sync public -> .next/standalone/public
        public_src = os.path.join(source_dir, "public")
        public_dest = os.path.join(standalone_dir, "public")
        if os.path.exists(public_src):
            if os.path.exists(public_dest):
                shutil.rmtree(public_dest)
            shutil.copytree(public_src, public_dest)
            print("Pre-synced: public -> .next/standalone/public")

        # Sync prisma engines -> .next/standalone/node_modules/.prisma
        prisma_src = os.path.join(source_dir, "node_modules", ".prisma")
        prisma_dest = os.path.join(standalone_dir, "node_modules", ".prisma")
        if os.path.exists(prisma_src):
            if os.path.exists(prisma_dest):
                shutil.rmtree(prisma_dest)
            shutil.copytree(prisma_src, prisma_dest)
            print("Pre-synced: node_modules/.prisma -> .next/standalone/node_modules/.prisma")

        # Sync .env -> .next/standalone/.env
        env_src = os.path.join(source_dir, ".env")
        env_dest = os.path.join(standalone_dir, ".env")
        if os.path.exists(env_src):
            shutil.copy2(env_src, env_dest)
            print("Pre-synced: .env -> .next/standalone/.env")

        # Sync prisma folder (including dev.db) -> .next/standalone/prisma
        prisma_dir_src = os.path.join(source_dir, "prisma")
        prisma_dir_dest = os.path.join(standalone_dir, "prisma")
        if os.path.exists(prisma_dir_src):
            if os.path.exists(prisma_dir_dest):
                shutil.rmtree(prisma_dir_dest)
            shutil.copytree(prisma_dir_src, prisma_dir_dest)
            print("Pre-synced: prisma -> .next/standalone/prisma")

        # Also sync dev.db directly into standalone root and root
        db_src = os.path.join(source_dir, "prisma", "dev.db")
        if os.path.exists(db_src):
            shutil.copy2(db_src, os.path.join(standalone_dir, "dev.db"))
            shutil.copy2(db_src, os.path.join(source_dir, "dev.db"))
            print("Pre-synced: dev.db -> .next/standalone/dev.db & root dev.db")

    include_files = [
        "server.js",
        "package.json",
        "package-lock.json",
        ".env",
        "next.config.ts",
        "tsconfig.json",
    ]
    
    include_dirs = [
        "public",
        "prisma",
        "app",
        "components",
        "lib",
    ]
    
    with zipfile.ZipFile(target_zip, 'w', zipfile.ZIP_DEFLATED) as zipf:
        # Add root files
        for f in include_files:
            p = os.path.join(source_dir, f)
            if os.path.exists(p):
                zipf.write(p, f)
                print(f"Added: {f}")
                
        # Add directories
        for d in include_dirs:
            dp = os.path.join(source_dir, d)
            if os.path.exists(dp):
                for root, dirs, files in os.walk(dp):
                    for file in files:
                        fp = os.path.join(root, file)
                        rel_path = os.path.relpath(fp, source_dir)
                        zipf.write(fp, rel_path)
                print(f"Added directory: {d}")
                
        # Add .next excluding cache
        next_dir = os.path.join(source_dir, ".next")
        if os.path.exists(next_dir):
            for root, dirs, files in os.walk(next_dir):
                if "cache" in root.split(os.sep):
                    continue
                for file in files:
                    fp = os.path.join(root, file)
                    rel_path = os.path.relpath(fp, source_dir)
                    zipf.write(fp, rel_path)
            print("Added directory: .next (excluding cache)")
            
    print(f"Created: {target_zip} ({os.path.getsize(target_zip) / (1024*1024):.2f} MB)")

if __name__ == "__main__":
    create_zip()

