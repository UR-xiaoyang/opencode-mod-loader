# OpenCode MOD Loader Community Guidelines

## Welcome

Welcome to the OpenCode MOD Loader community! This project enables developers to extend OpenCode Desktop through a powerful yet safe MOD system. We're building an open, inclusive community where developers can create, share, and collaborate on MODs that enhance the OpenCode experience.

## Our Values

### 🤝 Inclusivity
We welcome developers of all skill levels, backgrounds, and experiences. Whether you're creating your first MOD or you're a seasoned developer, your contributions matter.

### 🔒 Security First
MODs have access to sensitive user data and system resources. We prioritize security in every decision and expect all community members to do the same.

### 🎯 Quality Over Quantity
We value well-documented, tested, and maintained MODs over a large number of unmaintained experiments.

### 🌏 International Community
This project serves a global community. We maintain documentation in both English and Chinese, and welcome contributions in multiple languages.

### 📖 Open Knowledge
We believe in sharing knowledge. Document your solutions, explain your decisions, and help others learn.

## Code of Conduct

### Expected Behavior

- **Be respectful**: Treat all community members with respect and dignity
- **Be constructive**: Provide helpful feedback and critique ideas, not people
- **Be collaborative**: Share knowledge, help newcomers, and work together
- **Be honest**: Acknowledge mistakes, give credit, and be transparent
- **Be patient**: Remember that contributors are often volunteering their time
- **Be secure**: Report security vulnerabilities responsibly (see Security Policy)

### Unacceptable Behavior

- Harassment, discrimination, or hate speech of any kind
- Trolling, insulting comments, or personal attacks
- Publishing others' private information without permission
- Deliberately introducing security vulnerabilities or malicious code
- Spamming, excessive self-promotion, or off-topic content
- Any conduct that would be inappropriate in a professional setting

### Enforcement

Violations will be addressed through:
1. **Warning**: First offense typically receives a warning
2. **Temporary ban**: Repeated violations may result in temporary restrictions
3. **Permanent ban**: Severe or persistent violations result in permanent removal

Reports can be made to the maintainers privately. All reports will be reviewed confidentially.

## Contributing Guidelines

### Getting Started

1. **Read the documentation**: Familiarize yourself with [MODS.md](src/packages/desktop/MODS.md) and [AI_MOD_DEVELOPMENT.md](docs/AI_MOD_DEVELOPMENT.md)
2. **Check existing issues**: See if your idea or bug is already being discussed
3. **Start small**: Begin with documentation improvements or small bug fixes
4. **Ask questions**: Use GitHub Discussions for questions before opening issues

### Types of Contributions

#### 🐛 Bug Reports
- Use the bug report template
- Include reproduction steps, expected vs actual behavior
- Provide system info (OS, OpenCode version, MOD Loader version)
- Check if the issue exists in the latest version first

#### ✨ Feature Requests
- Use the feature request template
- Explain the use case and problem you're solving
- Consider if it could be implemented as a MOD first
- Be open to alternative solutions

#### 📝 Documentation
- Fix typos, improve clarity, add examples
- Translate documentation to other languages
- Create tutorials, guides, or video walkthroughs
- Document undocumented features or edge cases

#### 💻 Code Contributions
- Fork the repository and create a feature branch
- Follow the existing code style and conventions
- Add tests for new functionality
- Update documentation to reflect your changes
- Keep commits focused and write clear commit messages

#### 🎨 Example MODs
- Create MODs that demonstrate specific features or patterns
- Document the MOD's purpose and implementation
- Follow security best practices
- License your MOD appropriately (MIT or compatible)

### Pull Request Process

1. **Before submitting**:
   - Ensure your code follows project conventions
   - Run tests and verify your changes work
   - Update relevant documentation
   - Rebase on the latest main branch

2. **PR description should include**:
   - What problem does this solve?
   - What changes were made?
   - How was it tested?
   - Any breaking changes or migration notes?
   - Related issues (use "Fixes #123" syntax)

3. **Review process**:
   - Maintainers will review within 48-72 hours
   - Address feedback constructively
   - Keep the PR focused and scope-limited
   - Be patient - reviews take time

4. **After merge**:
   - Your contribution will be included in the next release
   - You'll be credited in release notes
   - Consider helping others by reviewing future PRs

## MOD Submission Guidelines

### Quality Standards

All submitted MODs must meet these requirements:

#### ✅ Functionality
- Works as described without errors
- Handles edge cases gracefully
- Provides useful error messages
- Degrades gracefully when dependencies are unavailable

#### 📄 Documentation
- Clear `README.md` explaining purpose and usage
- Installation instructions
- Configuration options documented
- Screenshots or demos when applicable
- Known limitations or issues listed

#### 🔐 Security
- No hardcoded credentials or secrets
- Input validation on all user-provided data
- Proper permission declarations in `mod.json`
- No unnecessary network requests
- CSP-compliant (no `eval()` or inline scripts)

#### 🧪 Testing
- Core functionality manually tested
- Works on supported platforms (Windows, macOS, Linux)
- Compatible with specified OpenCode versions
- No memory leaks or performance degradation

#### ⚖️ Licensing
- Must use an OSI-approved open source license
- Recommended: MIT, Apache 2.0, or GPL-3.0
- License clearly stated in repository
- Third-party dependencies properly attributed

### Prohibited Content

MODs must NOT:
- ❌ Collect or transmit personal data without explicit user consent
- ❌ Include cryptocurrency miners or adware
- ❌ Deliberately degrade performance
- ❌ Circumvent OpenCode security features
- ❌ Violate intellectual property rights
- ❌ Include offensive, discriminatory, or illegal content
- ❌ Impersonate official OpenCode features
- ❌ Make unauthorized network requests to third parties

### Naming Conventions

- Use clear, descriptive names
- Prefix with your organization/username (e.g., `acme.task-tracker`)
- Avoid generic names that could conflict with others
- Don't use "opencode-official" or imply official endorsement
- No trademarked names without permission

## Community Resources

### Communication Channels

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: Questions, ideas, and general discussion
- **Pull Requests**: Code contributions and reviews

### Getting Help

1. **Check documentation first**: Most questions are answered in docs
2. **Search existing issues**: Your question may already be answered
3. **Use GitHub Discussions**: For open-ended questions or ideas
4. **Be specific**: Provide context, what you've tried, error messages
5. **Follow up**: Update the thread if you solve your problem

### Helping Others

- Answer questions in Discussions
- Review pull requests
- Improve documentation
- Create tutorials or examples
- Triage and reproduce reported issues

## Maintainer Responsibilities

Maintainers commit to:
- Respond to issues and PRs within 48-72 hours
- Review contributions fairly and constructively
- Maintain clear communication about project direction
- Enforce the Code of Conduct consistently
- Keep the community informed about major changes
- Document decisions and rationale publicly

## Recognition

We celebrate contributions through:
- Credits in release notes
- Contributor mentions in README
- Highlighting exceptional MODs in documentation
- Annual contributor recognition

## Version and Change Management

### Semantic Versioning

The MOD Loader follows [Semantic Versioning](https://semver.org/):
- **Major** (X.0.0): Breaking changes to MOD API
- **Minor** (0.X.0): New features, backward compatible
- **Patch** (0.0.X): Bug fixes and minor improvements

### Deprecation Policy

When deprecating features:
1. Feature marked as deprecated with warning
2. Alternative solution documented
3. Minimum one minor version notice before removal
4. Migration guide provided

### Upstream Tracking

- OpenCode version compatibility documented in `mod-loader.json`
- Overlay approach minimizes breaking changes
- Upgrade guides provided for major OpenCode updates

## Security Policy

### Reporting Vulnerabilities

**DO NOT** open public issues for security vulnerabilities.

Instead:
1. Email security details to maintainers privately
2. Include: description, impact, reproduction steps
3. Allow 90 days for fix before public disclosure
4. Coordinate disclosure timing with maintainers

### Security Updates

- Critical vulnerabilities patched within 48 hours
- Security updates released out-of-band
- Users notified through GitHub Security Advisories
- CVEs assigned for serious vulnerabilities

### Responsible MOD Development

MOD developers must:
- Declare all required permissions honestly
- Validate and sanitize all inputs
- Use HTTPS for all network requests
- Never store credentials in plain text
- Follow OWASP security guidelines

## Frequently Asked Questions

### Can I monetize my MOD?
Yes, but you must:
- Clearly disclose any paid features or subscriptions
- Respect user privacy and data protection laws
- Comply with your chosen open source license
- Not require payment for basic functionality

### Can I use AI to develop MODs?
Yes! We encourage using AI assistants. The `AI_MOD_DEVELOPMENT.md` guide is specifically designed for AI-assisted development.

### How do I get my MOD featured?
Create a high-quality MOD that:
- Solves a real problem elegantly
- Has excellent documentation
- Maintains compatibility
- Gets positive community feedback

### What if my MOD breaks after an OpenCode update?
- Check the upgrade guide for breaking changes
- Update your MOD to maintain compatibility
- Mark incompatible versions in `engines.opencode`
- Request help in Discussions if stuck

### Can I fork this project?
Yes! The project is open source. Please:
- Respect the license terms
- Give credit to original authors
- Consider contributing improvements upstream

## Changes to Guidelines

These guidelines may evolve as the community grows. Major changes will be:
- Announced in GitHub Discussions
- Open for community feedback
- Documented with rationale
- Given transition period when applicable

## License

These Community Guidelines are licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

---

**Last Updated**: 2025-01-14  
**Version**: 1.0.0

For questions about these guidelines, open a Discussion or contact the maintainers.
