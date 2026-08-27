import os
import zipfile

def create_zip():
    target_zip = "/Users/amit/community/dezir-clab-deployment.zip"
    source_dir = "/Users/amit/community"
    
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
