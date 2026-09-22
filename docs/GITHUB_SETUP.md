# GitHub Repository Setup Guide

This guide helps you enable and configure all community features for the opencode-mod-loader repository.

## 📋 Prerequisites

- Repository admin access
- GitHub CLI installed (optional, for command-line setup)

## 🚀 Quick Setup Steps

### 1. Enable GitHub Discussions

1. Go to **Settings** → **General**
2. Scroll to **Features** section
3. Check ✅ **Discussions**
4. Click **Set up discussions**

#### Configure Discussion Categories

Go to **Discussions** tab → **Categories** → **Edit**

Add these categories (or use the template from `.github/DISCUSSION_CATEGORIES.md`):

- 💬 **General** - General discussion
- 💡 **Ideas** - Feature ideas and improvements
- ❓ **Q&A** - Questions and answers
- 🐛 **Troubleshooting** - Help with issues
- 🛠️ **MOD Development** - MOD creation discussions
- 📦 **Show and Tell** - Showcase your MODs
- 🌟 **Announcements** - Official announcements
- 🎉 **Community** - Community updates and events

### 2. Enable Security Features

1. Go to **Settings** → **Security** → **Code security and analysis**
2. Enable:
   - ✅ **Dependency graph**
   - ✅ **Dependabot alerts**
   - ✅ **Dependabot security updates**
   - ✅ **Secret scanning**
   - ✅ **Private vulnerability reporting**

#### Set Up Security Policy

- Your `SECURITY.md` file is already created
- GitHub will automatically recognize it

### 3. Configure Issue Templates

Your issue templates are already created in `.github/ISSUE_TEMPLATE/`:
- `bug_report.md`
- `feature_request.md`
- `mod_submission.md`
- `documentation.md`
- `config.yml`

**Verify they work:**
1. Go to **Issues** → **New issue**
2. You should see template options

### 4. Set Up Labels

#### Option A: Automatic (via GitHub Actions)

Push your changes and the `label-sync` workflow will create labels automatically from `.github/labels.yml`

#### Option B: Manual (via GitHub CLI)

```bash
gh auth refresh -h github.com
gh auth status

# Sync labels
gh label list
# The label-sync workflow will handle this automatically
```

#### Option C: Manual (via GitHub UI)

1. Go to **Issues** → **Labels**
2. Manually create labels from `.github/labels.yml`

### 5. Enable GitHub Actions

1. Go to **Settings** → **Actions** → **General**
2. Under **Actions permissions**, select:
   - ✅ **Allow all actions and reusable workflows**
3. Under **Workflow permissions**, select:
   - ✅ **Read and write permissions**
   - ✅ **Allow GitHub Actions to create and approve pull requests**
4. Click **Save**

#### Verify Workflows

After pushing, go to **Actions** tab to see:
- 🏷️ Label Sync
- ✅ Issue Checker
- 👋 Greetings
- 🏷️ Auto Label PRs
- 🗑️ Stale Issues

### 6. Configure Branch Protection

1. Go to **Settings** → **Branches**
2. Add rule for `main` branch:
   - ✅ **Require a pull request before merging**
   - ✅ **Require approvals** (at least 1)
   - ✅ **Require status checks to pass before merging**
   - ✅ **Require conversation resolution before merging**
   - ✅ **Do not allow bypassing the above settings**

### 7. Set Up Repository Topics

1. Go to repository main page
2. Click ⚙️ next to **About**
3. Add topics:
   ```
   opencode, mod-loader, extensions, electron, desktop-app, 
   typescript, javascript, open-source, modding
   ```

### 8. Configure Repository Details

1. Go to **Settings** → **General**
2. Update **Description**:
   ```
   Extension system for OpenCode Desktop - Load local MODs to customize and extend functionality
   ```
3. Set **Website**: (if you have documentation site)
4. Under **Features**, enable:
   - ✅ **Wikis** (optional, if you want a wiki)
   - ✅ **Issues**
   - ✅ **Discussions** (already enabled)
   - ✅ **Projects** (if you want project boards)

### 9. Add Community Health Files

Already created:
- ✅ `COMMUNITY_GUIDELINES.md`
- ✅ `CONTRIBUTING.md`
- ✅ `SECURITY.md`
- ✅ `CODE_OF_CONDUCT.md` (optional, create if needed)
- ✅ `.github/PULL_REQUEST_TEMPLATE.md`

GitHub will automatically recognize these in the **Insights** → **Community** section.

### 10. Create Pinned Issues (Optional)

1. Create important issues (e.g., "📋 Roadmap", "🎯 Good First Issues")
2. Pin them: Click **Pin issue** on the right sidebar

### 11. Set Up Notifications

For maintainers:
1. Go to **Settings** → **Notifications** (personal settings)
2. Configure notification preferences
3. Consider watching the repository with custom settings

### 12. Create GitHub Projects (Optional)

1. Go to **Projects** tab
2. Create project boards:
   - **Roadmap** - Track planned features
   - **Bug Triage** - Manage bug reports
   - **MOD Showcase** - Highlight community MODs

## 🔍 Verification Checklist

After setup, verify:

- [ ] Discussions tab is visible and categories are configured
- [ ] Issue templates appear when creating new issues
- [ ] Security tab shows security policy
- [ ] Labels are synced (check Issues → Labels)
- [ ] GitHub Actions are running (check Actions tab)
- [ ] Branch protection rules are active
- [ ] Community profile is complete (Insights → Community)
- [ ] README badges display correctly
- [ ] All workflow files pass without errors

## 🎯 Testing the Setup

1. **Create a test issue**: Verify templates work
2. **Create a test PR**: Verify auto-labeling works
3. **Start a discussion**: Verify categories are correct
4. **Check Actions tab**: Verify workflows run successfully

## 📝 Maintaining the Setup

### Regular Maintenance

1. **Review stale issues**: Weekly (handled by workflow)
2. **Update labels**: As needed (via `.github/labels.yml`)
3. **Review discussions**: Daily/weekly
4. **Triage issues**: As they come in
5. **Update documentation**: When features change

### Adding New Labels

Edit `.github/labels.yml` and push:
```yaml
- name: new-label
  color: hexcolor
  description: Description here
```

### Modifying Issue Templates

Edit files in `.github/ISSUE_TEMPLATE/` and push.

### Updating Workflows

Edit files in `.github/workflows/` and push.

## 🚨 Troubleshooting

### Labels not syncing
- Check Actions tab for errors
- Verify workflow permissions are set correctly
- Manually trigger the label-sync workflow

### Issue templates not showing
- Verify files are in `.github/ISSUE_TEMPLATE/`
- Check YAML syntax in `config.yml`
- Clear browser cache

### Workflows not running
- Check Actions are enabled in Settings
- Verify workflow permissions
- Check workflow syntax

### Discussions not appearing
- Verify Discussions are enabled in Settings
- Check that categories were created

## 📚 Additional Resources

- [GitHub Docs: Setting up community](https://docs.github.com/communities)
- [GitHub Docs: About discussions](https://docs.github.com/discussions)
- [GitHub Docs: Configuring issue templates](https://docs.github.com/communities/using-templates)
- [GitHub Actions Docs](https://docs.github.com/actions)

## 🆘 Need Help?

- Open a discussion in your repository
- Check GitHub's [community forum](https://github.community/)
- Review [GitHub's community guidelines](https://docs.github.com/site-policy/github-terms/github-community-guidelines)

---

Once setup is complete, update this checklist in your repository's project board or internal docs.
