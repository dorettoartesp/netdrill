#!/usr/bin/env bash
# Universal Project Bootstrap & Rebranding Wizard (Stack-Agnostic)
# Usage:
#   scripts/init-project.sh [OPTIONS]
#
# Options:
#   -n, --name <name>         Human-readable project name (e.g., "Acme Core")
#   -s, --slug <slug>         Lowercase kebab-case slug (e.g., "acme-core")
#   -a, --author <author>     Author name (e.g., "Acme Team")
#   -e, --email <email>       Author email (e.g., "dev@acme.com")
#   -o, --output <dir>        Target directory for new project (default: in-place)
#   -r, --reset-git           Reset Git history and create clean initial commit
#   -d, --dry-run             Preview substitutions without modifying files
#   -f, --force               Allow in-place execution in canonical template repository
#   --non-interactive         Fail if any required parameter is missing
#   -h, --help                Display this help message
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

PROJECT_NAME=""
PROJECT_SLUG=""
PROJECT_AUTHOR=""
PROJECT_EMAIL=""
OUTPUT_DIR=""
RESET_GIT=false
DRY_RUN=false
FORCE=false
NON_INTERACTIVE=false

usage() {
    cat <<EOF
Universal Project Bootstrap Wizard (agentic-tmpl)

Usage:
  $(basename "$0") [OPTIONS]

Options:
  -n, --name <name>         Human-readable project name (e.g., "Acme Core")
  -s, --slug <slug>         Lowercase kebab-case project identifier (e.g., "acme-core")
  -a, --author <author>     Author or team name (e.g., "Acme Team")
  -e, --email <email>       Author or team email (e.g., "dev@acme.com")
  -o, --output <dir>        Target directory for newly bootstrapped project
  -r, --reset-git           Reset Git history and create clean initial release commit
  -d, --dry-run             Preview changes without mutating files
  -f, --force               Allow in-place execution in canonical template repository
  --non-interactive         Run without interactive prompts (for CI and automation)
  -h, --help                Display this help message
EOF
    exit 0
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        -n|--name)
            PROJECT_NAME="$2"
            shift 2
            ;;
        -s|--slug)
            PROJECT_SLUG="$2"
            shift 2
            ;;
        -a|--author)
            PROJECT_AUTHOR="$2"
            shift 2
            ;;
        -e|--email)
            PROJECT_EMAIL="$2"
            shift 2
            ;;
        -o|--output)
            OUTPUT_DIR="$2"
            shift 2
            ;;
        -r|--reset-git)
            RESET_GIT=true
            shift
            ;;
        -d|--dry-run)
            DRY_RUN=true
            shift
            ;;
        -f|--force)
            FORCE=true
            shift
            ;;
        --non-interactive)
            NON_INTERACTIVE=true
            shift
            ;;
        -h|--help)
            usage
            ;;
        *)
            echo "Error: Unknown argument '$1'" >&2
            echo "Run '$(basename "$0") --help' for usage." >&2
            exit 1
            ;;
    esac
done

# Safety guard: prevent accidental in-place mutation of canonical template repo
if [[ -z "${OUTPUT_DIR}" && "${FORCE}" == false && "${DRY_RUN}" == false && -d "${ROOT_DIR}/.git" ]]; then
    ALL_REMOTES=$(git -C "${ROOT_DIR}" remote -v 2>/dev/null || true)
    if echo "${ALL_REMOTES}" | grep -q "dorettoartesp/agentic-tmpl"; then
        echo "Error: Detected canonical template repository origin." >&2
        echo "Refusing in-place mutation of template repo. Use --force to override, or specify --output <dir>." >&2
        exit 1
    fi
fi

# Auto-detect defaults from environment / git
DEFAULT_SLUG="$(basename "${ROOT_DIR}" | tr '[:upper:]' '[:lower:]' | tr '_' '-')"
if [[ "${DEFAULT_SLUG}" == "agentic-tmpl" ]]; then
    DEFAULT_SLUG="my-app"
fi
DEFAULT_NAME="$(echo "${DEFAULT_SLUG}" | tr '-' ' ' | awk '{for(i=1;i<=NF;i++)sub(/./,toupper(substr($i,1,1)),$i)}1')"
DEFAULT_AUTHOR="$(git -C "${ROOT_DIR}" config user.name 2>/dev/null || echo "Engineering Team")"
DEFAULT_EMAIL="$(git -C "${ROOT_DIR}" config user.email 2>/dev/null || echo "dev@example.com")"

prompt_value() {
    local var_name="$1"
    local prompt_text="$2"
    local default_val="$3"
    local current_val="${!var_name}"

    if [[ -n "${current_val}" ]]; then
        return 0
    fi

    if [[ "${NON_INTERACTIVE}" == true ]]; then
        if [[ -n "${default_val}" ]]; then
            printf -v "${var_name}" "%s" "${default_val}"
            return 0
        else
            echo "Error: Missing required option for ${prompt_text} in non-interactive mode." >&2
            exit 1
        fi
    fi

    local user_input
    read -r -p "${prompt_text} [${default_val}]: " user_input
    if [[ -z "${user_input}" ]]; then
        printf -v "${var_name}" "%s" "${default_val}"
    else
        printf -v "${var_name}" "%s" "${user_input}"
    fi
}

prompt_value PROJECT_NAME "Project Name (Human-readable)" "${DEFAULT_NAME}"
prompt_value PROJECT_SLUG "Project Slug (kebab-case)" "${DEFAULT_SLUG}"
prompt_value PROJECT_AUTHOR "Project Author/Team" "${DEFAULT_AUTHOR}"
prompt_value PROJECT_EMAIL "Author/Team Email" "${DEFAULT_EMAIL}"

# Validate kebab-case slug
if ! [[ "${PROJECT_SLUG}" =~ ^[a-z0-9]+(-[a-z0-9]+)*$ ]]; then
    echo "Error: Project slug '${PROJECT_SLUG}' must be lowercase kebab-case (e.g., 'acme-core')." >&2
    exit 1
fi

TARGET_DIR="${ROOT_DIR}"
if [[ -n "${OUTPUT_DIR}" ]]; then
    mkdir -p "${OUTPUT_DIR}"
    TARGET_DIR="$(cd "${OUTPUT_DIR}" && pwd)"

    CANONICAL_ROOT="$(cd "${ROOT_DIR}" && pwd)"
    if [[ "${TARGET_DIR}" == "${CANONICAL_ROOT}"* ]]; then
        echo "Error: Output directory cannot be inside the template source repository." >&2
        exit 1
    fi

    echo "==> Copying template to target directory: ${TARGET_DIR}..."
    if [[ "${DRY_RUN}" == false ]]; then
        (
            cd "${ROOT_DIR}"
            tar --exclude=".git" --exclude="site" --exclude=".superpowers/sdd" -cf - . | (cd "${TARGET_DIR}" && tar -xf -)
        )
    fi
fi

cd "${TARGET_DIR}"

echo "================================================================="
echo " Project Bootstrap Configuration:"
echo "   Name:   ${PROJECT_NAME}"
echo "   Slug:   ${PROJECT_SLUG}"
echo "   Author: ${PROJECT_AUTHOR} <${PROJECT_EMAIL}>"
echo "   Target: ${TARGET_DIR} $([[ -n "${OUTPUT_DIR}" ]] && echo "(new clone)" || echo "(in-place)")"
echo "   Reset:  ${RESET_GIT}"
echo "================================================================="

if [[ "${DRY_RUN}" == true ]]; then
    echo "[dry-run] Planned substitutions previewed. Exiting without writing changes."
    exit 0
fi

replace_in_file() {
    local search="$1"
    local replace="$2"
    local file="$3"

    if [[ ! -f "${file}" ]]; then
        return 0
    fi

    python3 -c "
import sys
search, replace, file_path = sys.argv[1], sys.argv[2], sys.argv[3]
try:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    if search in content:
        new_content = content.replace(search, replace)
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
except Exception as e:
    sys.stderr.write(f'Warning: Could not replace in {file_path}: {e}\n')
" "${search}" "${replace}" "${file}"
}

echo "==> Applying metadata replacements..."

# 1. Root documentation & orchestration
replace_in_file "# agentic-tmpl" "# ${PROJECT_NAME}" "README.md"
replace_in_file "agentic-tmpl" "${PROJECT_SLUG}" "README.md"
replace_in_file 'site_name: "agentic-tmpl Documentation"' "site_name: \"${PROJECT_NAME} Documentation\"" "mkdocs.yml"
replace_in_file "agentic-tmpl" "${PROJECT_SLUG}" "mkdocs.yml"
replace_in_file "agentic-tmpl" "${PROJECT_SLUG}" "cliff.toml"
replace_in_file "agentic-tmpl" "${PROJECT_SLUG}" "CONTRIBUTING.md"
replace_in_file "agentic-tmpl" "${PROJECT_SLUG}" "SECURITY.md"
replace_in_file "agentic-tmpl" "${PROJECT_SLUG}" "LICENSE"
replace_in_file "agentic-tmpl" "${PROJECT_SLUG}" "docker-compose.yml"

# 2. Environment templates
for env_file in .env.example .env.local.example .env.dev.example .env.hml.example .env.prd.example; do
    replace_in_file "agentic-tmpl" "${PROJECT_SLUG}" "${env_file}"
done

# 3. Documentation files
for doc_file in docs/index.md docs/ARCHITECTURE.md docs/DEVELOPMENT.md docs/SECURITY_PRACTICES.md \
                docs/adr/*.md docs/backlog/*.md docs/runbooks/*.md docs/api/*.md; do
    if [[ -f "${doc_file}" ]]; then
        replace_in_file "agentic-tmpl" "${PROJECT_SLUG}" "${doc_file}"
    fi
done

# 3. Git reset routine if requested
if [[ "${RESET_GIT}" == true || ! -d ".git" ]]; then
    echo "==> Initializing Git repository and resetting changelog..."
    rm -rf .git
    git init -b main

    git config user.name "${PROJECT_AUTHOR}"
    git config user.email "${PROJECT_EMAIL}"

    # Clear template design specs and plans for a clean canvas
    rm -f docs/superpowers/specs/* 2>/dev/null || true
    rm -f docs/superpowers/plans/* 2>/dev/null || true

    # Reset changelog
    cat > CHANGELOG.md <<EOF
# Changelog

All notable changes to this project will be documented in this file.

## Unreleased

### Features
- initialize project from template (${PROJECT_NAME})
EOF

    git add .
    git commit -m "feat: initialize project from template (${PROJECT_NAME})"
fi

echo "==> Running quality gate verification (make check)..."
make check

echo ""
echo "================================================================="
echo " ✓ Project '${PROJECT_NAME}' (${PROJECT_SLUG}) successfully bootstrapped!"
echo "   Quality gate passed with exit code 0."
echo "================================================================="
