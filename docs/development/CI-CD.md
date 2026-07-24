# CI/CD Pipeline Documentation

Trip-Sync uses GitHub Actions for continuous integration and deployment.

## Workflows

### 1. CI Workflow (`ci.yml`)

**Triggers:**

- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`

**Jobs:**

#### Test & Build

- ✅ TypeScript type checking
- ✅ Run test suite (Vitest)
- ✅ Generate coverage report
- ✅ Build production bundle
- ✅ Upload artifacts

#### Security Audit

- ✅ Run `npm audit` for vulnerabilities
- ✅ Check for outdated dependencies

#### Lint Check

- 🔄 Placeholder for ESLint (to be configured)

**Configuration:**
No secrets required. Runs automatically on every push/PR.

---

### 2. Deploy Workflow (`deploy.yml`)

**Triggers:**

- Manual trigger via GitHub Actions UI
- Push to `main` branch
- Git tags matching `v*`

**Deployment Options:**

The deploy workflow includes templates for multiple deployment platforms. Uncomment and configure the one you're using:

#### Option 1: Docker + Container Registry

```yaml
# Required Secrets:
# - DOCKER_USERNAME
# - DOCKER_PASSWORD

- name: Build and push Docker image
  uses: docker/build-push-action@v5
  with:
    push: true
    tags: your-dockerhub-username/trip-sync:latest
```

**Setup:**

1. Create Docker Hub account
2. Add secrets to GitHub repository settings
3. Uncomment Docker steps in `deploy.yml`

#### Option 2: Railway

```yaml
# Required Secrets:
# - RAILWAY_TOKEN

- name: Deploy to Railway
  run: railway up --service trip-sync
```

**Setup:**

1. Create Railway account and project
2. Generate API token: `railway login` → Account Settings → Tokens
3. Add `RAILWAY_TOKEN` secret to GitHub
4. Uncomment Railway steps in `deploy.yml`

#### Option 3: Render

```yaml
# Required Secrets:
# - RENDER_API_KEY
# - RENDER_SERVICE_ID

- name: Deploy to Render
  run: curl -X POST https://api.render.com/v1/services/$RENDER_SERVICE_ID/deploys
```

**Setup:**

1. Create Render account and web service
2. Get API key from Account Settings
3. Get Service ID from service dashboard URL
4. Add secrets to GitHub
5. Uncomment Render steps in `deploy.yml`

#### Option 4: VPS via SSH

```yaml
# Required Secrets:
# - SSH_HOST
# - SSH_USERNAME
# - SSH_PRIVATE_KEY

- name: Deploy via SSH
  uses: appleboy/ssh-action@v1.0.0
  with:
    script: |
      cd /var/www/trip-sync
      git pull
      npm install
      npm run build
      pm2 restart trip-sync
```

**Setup:**

1. Generate SSH key: `ssh-keygen -t ed25519`
2. Add public key to server: `ssh-copy-id user@server`
3. Add private key to GitHub secrets
4. Uncomment SSH steps in `deploy.yml`

---

## GitHub Secrets Configuration

Add these secrets in: **GitHub Repo** → **Settings** → **Secrets and variables** → **Actions**

### Required for All Deployments

- None (deployment method determines requirements)

### Docker Deployment

| Secret            | Description             | How to Get                               |
| ----------------- | ----------------------- | ---------------------------------------- |
| `DOCKER_USERNAME` | Docker Hub username     | Your Docker Hub account                  |
| `DOCKER_PASSWORD` | Docker Hub access token | Docker Hub → Account Settings → Security |

### Railway Deployment

| Secret          | Description       | How to Get                                  |
| --------------- | ----------------- | ------------------------------------------- |
| `RAILWAY_TOKEN` | Railway API token | `railway login` → Account Settings → Tokens |

### Render Deployment

| Secret              | Description        | How to Get                                     |
| ------------------- | ------------------ | ---------------------------------------------- |
| `RENDER_API_KEY`    | Render API key     | Render Dashboard → Account Settings → API Keys |
| `RENDER_SERVICE_ID` | Service identifier | Service URL: `render.com/services/{this-id}`   |

### SSH Deployment

| Secret            | Description           | How to Get                    |
| ----------------- | --------------------- | ----------------------------- |
| `SSH_HOST`        | Server IP or hostname | Your VPS provider             |
| `SSH_USERNAME`    | SSH username          | Usually `root` or custom user |
| `SSH_PRIVATE_KEY` | SSH private key       | `cat ~/.ssh/id_ed25519`       |

### Optional: Sentry Release Tracking

| Secret              | Description       | How to Get                      |
| ------------------- | ----------------- | ------------------------------- |
| `SENTRY_AUTH_TOKEN` | Sentry auth token | Sentry → Settings → Auth Tokens |

---

## Manual Deployment

### Trigger Deployment via GitHub UI

1. Go to **Actions** tab
2. Select **Deploy** workflow
3. Click **Run workflow**
4. Choose environment (staging/production)
5. Click **Run workflow** button

### Trigger Deployment via CLI

```bash
# Using GitHub CLI (gh)
gh workflow run deploy.yml -f environment=production

# Check deployment status
gh run list --workflow=deploy.yml
```

---

## Environment Configuration

### Staging Environment

Create GitHub environment: **Settings** → **Environments** → **New environment** → `staging`

**Environment Variables** (configure in GitHub):

```
DATABASE_URL=postgresql://...
SENTRY_DSN=https://...
STRIPE_SECRET_KEY=sk_test_...
```

### Production Environment

Create GitHub environment: `production`

**Protection Rules:**

- ✅ Required reviewers (1+)
- ✅ Deployment branches: `main` only
- ✅ Wait timer: 5 minutes

**Environment Variables:**

```
DATABASE_URL=postgresql://... (production)
SENTRY_DSN=https://... (production)
STRIPE_SECRET_KEY=sk_live_...
```

---

## Workflow Status Badges

Add to README.md:

```markdown
![CI](https://github.com/your-username/trip-sync/actions/workflows/ci.yml/badge.svg)
![Deploy](https://github.com/your-username/trip-sync/actions/workflows/deploy.yml/badge.svg)
```

---

## Troubleshooting

### Tests Failing in CI but Pass Locally

**Common causes:**

1. **Environment differences**: Check Node.js versions match
2. **Missing environment variables**: Add to GitHub secrets
3. **Timezone issues**: Use UTC in tests or set `TZ=UTC` in workflow

### Build Failing

**Common causes:**

1. **TypeScript errors**: Run `npm run check` locally first
2. **Missing dependencies**: Ensure `package-lock.json` is committed
3. **Build script issues**: Test `npm run build` locally

### Deployment Failing

**Common causes:**

1. **Missing secrets**: Verify all required secrets are set
2. **Wrong secret names**: Check for typos
3. **Permission errors**: Ensure service account has deploy permissions
4. **Network issues**: Check if deployment service is accessible

### Docker Build Failing

**Common causes:**

1. **Dockerfile errors**: Test locally with `docker build .`
2. **Missing .dockerignore**: Ensure `node_modules` is excluded
3. **Build context too large**: Optimize Dockerfile layers

---

## Best Practices

### 1. Branch Protection

Configure in **Settings** → **Branches** → **Branch protection rules**:

- ✅ Require pull request reviews
- ✅ Require status checks to pass (CI workflow)
- ✅ Require branches to be up to date
- ✅ Restrict pushes to `main`

### 2. Security

- ❌ Never commit secrets to repository
- ✅ Use GitHub encrypted secrets
- ✅ Rotate secrets regularly
- ✅ Use least-privilege access for deployment tokens

### 3. Testing

- ✅ Run tests locally before pushing
- ✅ Maintain >70% test coverage
- ✅ Add tests for new features
- ✅ Keep CI runs fast (<5 minutes)

### 4. Deployment

- ✅ Deploy to staging first
- ✅ Test in staging environment
- ✅ Use manual approval for production
- ✅ Roll back if issues detected
- ✅ Monitor Sentry after deployment

---

## Monitoring Deployments

### View Deployment History

```bash
# List recent deployments
gh run list --workflow=deploy.yml --limit 10

# View specific deployment logs
gh run view <run-id> --log
```

### Automated Notifications

Add to workflow for Slack/Discord notifications:

```yaml
- name: Notify deployment
  uses: slackapi/slack-github-action@v1
  with:
    webhook-url: ${{ secrets.SLACK_WEBHOOK_URL }}
    payload: |
      {
        "text": "Deployment to ${{ inputs.environment }} completed!",
        "commit": "${{ github.sha }}"
      }
```

---

## Cost Optimization

GitHub Actions is free for public repositories. For private repositories:

- **Free tier**: 2,000 minutes/month
- **Pro**: 3,000 minutes/month
- **Team**: 10,000 minutes/month

**Tips to reduce CI/CD costs:**

1. Use `cache: 'npm'` in setup-node (already configured)
2. Skip CI for documentation changes: `[skip ci]` in commit message
3. Use matrix strategy sparingly
4. Cancel redundant runs (pushes to same branch)

---

## Future Enhancements

- [ ] Add Lighthouse performance testing
- [ ] Add end-to-end tests (Playwright/Cypress)
- [ ] Add automatic dependency updates (Dependabot)
- [ ] Add database migration checks
- [ ] Add deployment rollback automation
- [ ] Add canary deployments
- [ ] Add A/B testing infrastructure

---

**Last Updated**: 2026-05-11
