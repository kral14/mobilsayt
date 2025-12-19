
import os
import re

file_path = r"c:\Users\nesib\Desktop\mobilsayt\web\src\pages\Qaimeler\Satis.tsx"

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
i = 0
while i < len(lines):
    line = lines[i]
    stripped = line.strip()
    
    # Check for <UniversalContainer> followed by style={{ (or key=) on next line or same line
    # The main page container (valid) usually wraps UniversalNavbar etc.
    # The erroneous ones replaced <div>
    
    is_suspicious = False
    
    if "<UniversalContainer>" in line:
        # Look ahead for style={{
        if i + 1 < len(lines):
            next_line = lines[i+1].strip()
            if next_line.startswith("style={{"):
                is_suspicious = True
            if next_line.startswith("key="):
                is_suspicious = True
        
        # Also check if line itself has props (which UniversalContainer shouldn't have in this context if valid)
        # But wait, universal container replaced <div> so it might have props if they were on same line?
        # My previous script preserved line content ONLY if it matched "return (", otherwise it replaced WHOLE LINE with "<UniversalContainer>\n"
        # So " <div style=..." became "<UniversalContainer>\n"
        # So props are usually on NEXT line.
        
        if is_suspicious:
            # Revert to <div
            # Preserve indentation
            indent = line.split('<')[0]
            new_lines.append(indent + "<div\n")
            i += 1
            continue

    # Also check closing tag </UniversalContainer>
    # The valid one is at the very end of the component return.
    # Erroneous ones are likely inside the logic.
    # We can assume that if we reverted an opening tag, we should revert a closing tag... 
    # But matching them is hard without parsing.
    # However, standard indentation usually matches.
    
    if "</UniversalContainer>" in line:
        # If indentation is deeper than main container (4 spaces normally), robust heuristic.
        # Main container indentation is 4 spaces.
        # Erroneous ones (modals) are usually deeply indented (e.g. 10 spaces).
        indent_len = len(line) - len(line.lstrip())
        if indent_len > 4:
            new_lines.append(line.replace("</UniversalContainer>", "</div>"))
            i += 1
            continue

    new_lines.append(line)
    i += 1

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("Reverted suspicious UniversalContainer usages in Satis.tsx")
