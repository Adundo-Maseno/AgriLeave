import re
import subprocess

def test_syntax():
    # 1. Test Code.js
    res_code = subprocess.run(['node', '-c', 'Code.js'], capture_output=True, text=True)
    if res_code.returncode != 0:
        print("Code.js syntax error:", res_code.stderr)
        return False
    print("Code.js syntax OK")

    # 2. Test Index.html
    with open('Index.html', 'r', encoding='utf-8') as f:
        html = f.read()

    div_open = len(re.findall(r'<div\b', html, re.IGNORECASE))
    div_close = len(re.findall(r'</div>', html, re.IGNORECASE))
    assert div_open == div_close, f"Div mismatch: {div_open} vs {div_close}"
    print(f"Index.html div balance OK ({div_open} == {div_close})")

    scripts = re.findall(r'<script\b[^>]*>(.*?)</script>', html, re.DOTALL | re.IGNORECASE)
    for i, script in enumerate(scripts):
        fname = f'scratch/temp_test_script_{i}.js'
        with open(fname, 'w', encoding='utf-8') as sf:
            sf.write(script)
        r = subprocess.run(['node', '-c', fname], capture_output=True, text=True)
        if r.returncode != 0:
            print(f"Index.html script {i} syntax error:", r.stderr)
            return False
        print(f"Index.html script {i} OK")
    return True

if __name__ == '__main__':
    test_syntax()
