import os
from pathlib import Path

# --- Configuration ---
# NOTE: Use raw string (r'...') for Windows paths to avoid issues with backslashes
BASE_DIR = Path(r"C:\Users\ndera\Videos\7b\src")
OUTPUT_FILE_NAME = "project_code.md"
OUTPUT_FILE = BASE_DIR / OUTPUT_FILE_NAME

# File extensions to include (used for filtering and for Markdown syntax highlighting)
EXTENSIONS = {
    ".tsx": "tsx",
    ".jsx": "jsx",
    ".ts": "typescript"
}
# --- End Configuration ---

def compile_code_to_markdown():
    """
    Recursively searches the base directory for specified files and compiles
    their content into a single, formatted Markdown file.
    """
    
    # 1. Open the output file in write mode ('w'), which clears it first
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as outfile:
        
        outfile.write("## Project Code Compilation\n\n")
        
        # 2. Recursively find files matching the extensions
        # Path.rglob() performs the recursive search
        for file_path in BASE_DIR.rglob("*"):
            
            # Check if the file is a regular file and has one of the target extensions
            if file_path.is_file() and file_path.suffix in EXTENSIONS:
                
                # Get the Markdown language tag for syntax highlighting
                lang = EXTENSIONS[file_path.suffix]
                
                # Calculate the relative path for the output file note
                # This makes the output cleaner
                relative_path = file_path.relative_to(BASE_DIR)
                
                print(f"Processing: {relative_path}")

                try:
                    # 3. Write the file content using Markdown formatting
                    
                    # File Name Heading
                    outfile.write(f"## {file_path.name}\n")
                    
                    # Horizontal Rule Separator
                    outfile.write("---\n")
                    
                    # Relative Path Note (as a Markdown quote)
                    outfile.write(f"> Path: {relative_path}\n\n")
                    
                    # Start of the code fence with the language tag
                    outfile.write(f"```{lang}\n")
                    
                    # Read and write the file content
                    with open(file_path, 'r', encoding='utf-8') as infile:
                        outfile.write(infile.read())
                        
                    # End of the code fence
                    outfile.write("\n```\n\n")

                except Exception as e:
                    # Handle files that might be inaccessible or have encoding issues
                    outfile.write(f"\n**ERROR: Could not read file {file_path}. Reason: {e}**\n\n")


    print(f"\n---")
    print(f"✅ Success! Code successfully extracted to: {OUTPUT_FILE}")
    print(f"---")

if __name__ == "__main__":
    # Create the base directory if it doesn't exist (helpful for testing)
    BASE_DIR.mkdir(parents=True, exist_ok=True)
    compile_code_to_markdown()