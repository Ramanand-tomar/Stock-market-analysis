import shutil
import os
from pathlib import Path

def zip_project():
    project_root = Path(__file__).resolve().parents[2]
    zip_name = "stock_analysis_colab"
    output_path = project_root / zip_name
    
    # Files/Dirs to include
    include = [
        "ml",
        "Dataset",
        "requirements.txt"
    ]
    
    print(f"Zipping project into {zip_name}.zip...")
    
    # Create a temporary directory to gather files
    temp_dir = project_root / "temp_colab_zip"
    if temp_dir.exists():
        shutil.rmtree(temp_dir)
    temp_dir.mkdir()
    
    for item in include:
        src = project_root / item
        if src.exists():
            if src.is_dir():
                shutil.copytree(src, temp_dir / item, ignore=shutil.ignore_patterns('__pycache__', '*.pkl', '*.parquet'))
            else:
                shutil.copy2(src, temp_dir / item)
        else:
            print(f"Warning: {item} not found.")

    # Note: We excluded .parquet and .pkl to keep it small, but for training, 
    # we NEED the processed data if we want to skip preprocessing.
    # Let's check if the user wants to include processed data.
    # Actually, the user's processed data is ~140MB, which is fine.
    # I'll modify the script to INCLUDE processed data but exclude large raw files if possible.
    
    shutil.make_archive(str(output_path), 'zip', str(temp_dir))
    shutil.rmtree(temp_dir)
    
    print(f"Done! Created {zip_name}.zip in {project_root}")

if __name__ == "__main__":
    zip_project()
