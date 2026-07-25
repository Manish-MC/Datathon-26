import os
import re

dir_path = "c:/5th Sem/Datathon 26'/police-ai-platform/frontend/src"

replacements = {
    r'bg-\[\#0a0f1d\]': 'bg-sys-bg',
    r'bg-\[\#070b13\]': 'bg-sys-bg',
    r'bg-\[\#090d16\]': 'bg-sys-bg',
    r'bg-\[\#111726\]': 'bg-sys-surface',
    r'bg-\[\#0c1222\]': 'bg-sys-surface',
    r'bg-slate-950': 'bg-sys-bg',
    r'bg-slate-900(?![/\-])': 'bg-sys-surface',
    r'bg-slate-800(?![/\-])': 'bg-sys-surface-hover',
    r'text-slate-100': 'text-sys-text-main',
    r'text-slate-200': 'text-sys-text-main',
    r'text-slate-300': 'text-sys-text-muted',
    r'text-slate-400': 'text-sys-text-muted',
    r'border-slate-800': 'border-sys-border',
    r'border-slate-700': 'border-sys-border-strong',
    r'text-white': 'text-sys-text-inverse',
    r'text-blue-400': 'text-sys-primary',
    r'bg-blue-600/15': 'bg-sys-primary/15',
    r'border-blue-500': 'border-sys-primary',
    r'bg-slate-800/40': 'bg-sys-surface-hover/50',
    r'bg-slate-800/50': 'bg-sys-surface-hover/50',
    r'bg-blue-600(?![/\-])': 'bg-sys-primary',
    r'hover:bg-blue-500': 'hover:bg-sys-primary-hover',
    r'text-slate-500': 'text-sys-text-muted',
}

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = content
    for pattern, replacement in replacements.items():
        new_content = re.sub(pattern, replacement, new_content)
        
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {filepath}")

for root, _, files in os.walk(dir_path):
    for file in files:
        if file.endswith('.jsx'):
            process_file(os.path.join(root, file))
