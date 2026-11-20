# Annotated test cases for .semgrep/rules.yml (`bash scripts/semgrep.sh test`)

# ruleid: tls-verification-disabled
httpx.get("https://example.com", verify=False)

# ok: tls-verification-disabled
httpx.get("https://example.com", verify=True)

# ruleid: raw-sql-format
cursor.execute(f"SELECT * FROM users WHERE id = {user_id}")

# ok: raw-sql-format
cursor.execute("SELECT * FROM users WHERE id = %s", [user_id])

# ruleid: secret-key-hardcoded
SECRET_KEY = "insecure-hardcoded-secret-key"

# ok: secret-key-hardcoded
SECRET_KEY = env("SECRET_KEY")
