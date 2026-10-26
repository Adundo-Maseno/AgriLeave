import re
import subprocess

def test_changes():
    with open('Index.html', 'r', encoding='utf-8') as f:
        content = f.read()

    print("Original size:", len(content))
    # We will write the modifications test script
    # First verify current div and tag balance
    div_open = len(re.findall(r'<div\b', content, re.IGNORECASE))
    div_close = len(re.findall(r'</div>', content, re.IGNORECASE))
    assert div_open == div_close, f"Divs unbalanced initially: {div_open} vs {div_close}"
    print(f"Initial div balance OK: {div_open}")

if __name__ == '__main__':
    test_changes()
