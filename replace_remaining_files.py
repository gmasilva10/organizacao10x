#!/usr/bin/env python3
"""
Script para substituir .eq('tenant_id' por .eq('org_id' nos arquivos restantes
"""
import os
import re

files_to_update = [
    "web/app/api/guidelines/versions/[id]/correct/route.ts",
    "web/app/api/guidelines/versions/[id]/preview/route.ts",
    "web/app/api/guidelines/versions/[id]/publish/route.ts",
    "web/app/api/guidelines/versions/[id]/rules/route.ts",
    "web/app/api/guidelines/versions/[id]/rules/[ruleId]/route.ts",
    "web/app/api/guidelines/versions/[id]/set-default/route.ts",
    "web/app/api/guidelines/versions/[id]/unpublish/route.ts",
    "web/app/api/occurrence-groups/[id]/route.ts",
    "web/app/api/occurrence-types/[id]/route.ts",
    "web/app/api/occurrences/[id]/route.ts",
    "web/app/api/occurrences/[id]/attachments/route.ts",
    "web/app/api/occurrences/[id]/attachments/[attachmentId]/route.ts",
    "web/app/api/occurrences/[id]/close/route.ts",
    "web/app/api/occurrences/[id]/reminder/route.ts",
    "web/app/api/professionals/[id]/route.ts",
    "web/app/api/professionals/[id]/create-user/route.ts",
    "web/app/api/professionals/[id]/link-user/route.ts",
    "web/app/api/students/[id]/anamnesis/route.ts",
    "web/app/api/students/[id]/anamnesis/sections/[sectionId]/route.ts",
    "web/app/api/students/[id]/occurrences/route.ts",
    "web/app/api/students/[id]/occurrences/[occurrenceId]/route.ts",
    "web/app/api/students/[id]/relationship-logs/route.ts",
    "web/app/api/students/[id]/responsibles/route.ts",
    "web/app/api/students/[id]/responsibles/[responsibleId]/route.ts",
]

def replace_in_file(filepath):
    """Replace .eq('tenant_id' with .eq('org_id' in a file"""
    if not os.path.exists(filepath):
        print(f"WARNING: File not found: {filepath}")
        return False
    
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Count occurrences before replacement
        count_before = content.count(".eq('tenant_id'")
        
        # Perform replacement
        new_content = content.replace(".eq('tenant_id'", ".eq('org_id'")
        
        # Count occurrences after replacement
        count_after = new_content.count(".eq('tenant_id'")
        
        # Write back if changes were made
        if content != new_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"OK {filepath}: {count_before - count_after} replacements")
            return True
        else:
            print(f"INFO {filepath}: No changes needed")
            return False
    except Exception as e:
        print(f"ERROR processing {filepath}: {e}")
        return False

def main():
    print("Starting tenant_id -> org_id replacement...\n")
    
    total_files = 0
    updated_files = 0
    
    for filepath in files_to_update:
        total_files += 1
        if replace_in_file(filepath):
            updated_files += 1
    
    print(f"\nSummary:")
    print(f"   Total files processed: {total_files}")
    print(f"   Files updated: {updated_files}")
    print(f"   Files unchanged: {total_files - updated_files}")
    print(f"\nDone!")

if __name__ == "__main__":
    main()

