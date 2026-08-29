import os
import zipfile

def make_zip():
    target_zip = "/Users/amit/community/dezir-clab-express-deployment.zip"
    source_dir = "/Users/amit/community"
    
    include_dirs = ["server", "dist", "public", "prisma"]
    include_files = ["server.js", "package.json", "package-lock.json", ".env"]

    if os.path.exists(target_zip):
        os.remove(target_zip)

    with zipfile.ZipFile(target_zip, 'w', zipfile.ZIP_DEFLATED) as zipf:
        # Add single files
        for f in include_files:
            p = os.path.join(source_dir, f)
            if os.path.exists(p):
                zipf.write(p, f)
                print(f"Added file: {f}")

        # Add directories
        for d in include_dirs:
            dir_path = os.path.join(source_dir, d)
            if os.path.exists(dir_path):
                for root, dirs, files in os.walk(dir_path):
                    for file in files:
                        full_path = os.path.join(root, file)
                        rel_path = os.path.relpath(full_path, source_dir)
                        zipf.write(full_path, rel_path)
                print(f"Added directory: {d}")

    size_mb = os.path.getsize(target_zip) / (1024 * 1024)
    print(f"✅ Created: {target_zip} ({size_mb:.2f} MB)")

if __name__ == '__main__':
    make_zip()
