# Cloud Storage Setup Guide (S3 / R2)

Cloud storage enables users to upload photos and documents to their trips. TripSync supports both AWS S3 and Cloudflare R2.

## Why Cloud Storage?

**Without Storage:**

- ❌ Photo uploads disabled
- ❌ Document uploads disabled
- ❌ Confirmation images disabled
- ❌ Mood board images disabled

**With Storage:**

- ✅ Unlimited photo uploads
- ✅ Document management (PDFs, images)
- ✅ Booking confirmations
- ✅ Mood board functionality
- ✅ Automatic image optimization
- ✅ Signed URLs for security

## Cloudflare R2 vs AWS S3

| Feature          | Cloudflare R2              | AWS S3        |
| ---------------- | -------------------------- | ------------- |
| **Free Tier**    | 10 GB storage              | 5 GB storage  |
| **Storage Cost** | $0.015/GB                  | $0.023/GB     |
| **Egress Cost**  | **FREE** ⭐                | $0.09/GB      |
| **API Calls**    | $4.50/million              | $5.00/million |
| **Best For**     | Public files, high traffic | AWS ecosystem |
| **Setup Time**   | 5 minutes                  | 10 minutes    |

**Recommendation:** Use R2 for significant cost savings on egress fees.

---

## Option 1: Cloudflare R2 (Recommended)

### Step 1: Create Cloudflare Account

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com/)
2. Sign up (free account)

### Step 2: Create R2 Bucket

1. Navigate to **R2 Object Storage** in sidebar
2. Click **Create Bucket**
3. Enter bucket name: `tripsync-uploads`
4. Choose location: Automatic
5. Click **Create Bucket**

### Step 3: Generate API Token

1. Click **Manage R2 API Tokens**
2. Click **Create API Token**
3. Token name: `TripSync Production`
4. Permissions: **Object Read & Write**
5. TTL: Never expire
6. Click **Create API Token**
7. **SAVE THESE VALUES** (shown only once):
   - Access Key ID
   - Secret Access Key

### Step 4: Get Account ID

1. Go to R2 overview page
2. Copy your **Account ID** (shown at top)

### Step 5: Configure Environment Variables

Add to `.env.production`:

```bash
# Cloudflare R2 Configuration
R2_ACCOUNT_ID=your_account_id_here
R2_ACCESS_KEY_ID=your_access_key_here
R2_SECRET_ACCESS_KEY=your_secret_key_here
R2_BUCKET_NAME=tripsync-uploads
```

### Optional: Custom Domain (Public URLs)

To serve files from your domain (e.g., `uploads.tripsync.com`):

1. Go to your R2 bucket settings
2. Click **Connect Domain**
3. Enter your subdomain: `uploads.yourdomain.com`
4. Add DNS CNAME record as instructed
5. Add to `.env.production`:

```bash
R2_PUBLIC_URL=https://uploads.yourdomain.com
```

### Cost Example (R2)

- 50 GB storage: $0.75/month
- 500 GB transfers: **$0** (no egress fees!)
- 1M API calls: $4.50/month
- **Total: ~$5.25/month**

---

## Option 2: AWS S3

### Step 1: Create S3 Bucket

1. Go to [AWS Console](https://console.aws.amazon.com/) → S3
2. Click **Create Bucket**
3. Bucket name: `tripsync-uploads-production`
4. Region: Choose closest to your users (e.g., `us-east-1`)
5. **Block Public Access**: Keep enabled (we'll use signed URLs)
6. **Versioning**: Disabled (optional)
7. Click **Create Bucket**

### Step 2: Configure CORS

1. Open your bucket
2. Go to **Permissions** → **CORS**
3. Click **Edit**
4. Paste the configuration from `docs/S3-CORS.json`:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedOrigins": ["https://yourdomain.com", "http://localhost:3000"],
    "ExposeHeaders": ["ETag", "Content-Length"],
    "MaxAgeSeconds": 3000
  }
]
```

4. Update `AllowedOrigins` with your actual domain
5. Click **Save**

### Step 3: Create IAM User

1. Go to **IAM** → **Users**
2. Click **Create User**
3. Username: `tripsync-app`
4. Click **Next**

### Step 4: Attach Policy

Option A: Use AWS Managed Policy (Simple)

1. Select **Attach policies directly**
2. Search for `AmazonS3FullAccess`
3. Check the box
4. Click **Next** → **Create User**

Option B: Custom Policy (More Secure)

1. Select **Attach policies directly**
2. Click **Create Policy**
3. Choose JSON and paste:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject", "s3:ListBucket"],
      "Resource": [
        "arn:aws:s3:::tripsync-uploads-production",
        "arn:aws:s3:::tripsync-uploads-production/*"
      ]
    }
  ]
}
```

4. Name: `TripSyncS3Access`
5. Create and attach to user

### Step 5: Create Access Keys

1. Open the user you just created
2. Go to **Security Credentials**
3. Click **Create Access Key**
4. Choose **Application running outside AWS**
5. Click **Next** → **Create Access Key**
6. **SAVE THESE VALUES** (shown only once):
   - Access Key ID
   - Secret Access Key

### Step 6: Configure Environment Variables

Add to `.env.production`:

```bash
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=tripsync-uploads-production
AWS_REGION=us-east-1
```

### Cost Example (S3)

- 50 GB storage: $1.15/month
- 500 GB transfers: **$45/month** (expensive!)
- 1M API calls: $5/month
- **Total: ~$51.15/month**

---

## File Upload Configuration

### File Size Limits (Already Configured)

```typescript
MAX_IMAGE_SIZE = 25MB      // Photos, mood board
MAX_DOCUMENT_SIZE = 10MB   // PDFs, documents
```

### Allowed File Types

**Images:**

- JPEG/JPG
- PNG
- HEIC (iPhone photos)
- WebP

**Documents:**

- PDF
- JPEG/JPG/PNG

### Security Features

1. **File Type Validation** - Server-side MIME type checking
2. **Signed URLs** - Temporary access (1 hour default)
3. **Private Buckets** - Files not publicly accessible
4. **Virus Scanning** - TODO: Add ClamAV integration

---

## Testing Your Setup

### Test with Script

```bash
npm run test:services
```

### Manual Test

1. Start your app
2. Log in
3. Go to a trip
4. Try uploading a photo
5. Check browser console for errors
6. Verify file appears in your bucket

### Test Signed URLs

```bash
curl "http://localhost:3000/api/upload/signed-url/your-file-key"
```

Should return a temporary signed URL.

---

## Monitoring & Maintenance

### Check Storage Usage

**R2:**

1. Go to R2 dashboard
2. View storage metrics

**S3:**

```bash
aws s3 ls s3://tripsync-uploads-production --summarize --human-readable --recursive
```

### Check Upload Errors

Errors are logged in your application logs:

```bash
docker-compose -f docker-compose.prod.yml logs app | grep "upload"
```

### Clean Up Old Files

Create a lifecycle policy to delete old test files:

**S3 Lifecycle Rule:**

1. Go to bucket → **Management** → **Lifecycle rules**
2. Create rule to delete objects older than 90 days with prefix `test-`

**R2:**
Currently no automatic lifecycle rules - clean manually or via script.

---

## Troubleshooting

### Upload Fails with 403 Forbidden

**Cause:** Invalid credentials or insufficient permissions

**Fix:**

1. Verify credentials in `.env.production`
2. Check IAM policy includes `s3:PutObject`
3. Test credentials:

```bash
aws s3 ls s3://your-bucket --profile tripsync
```

### CORS Errors in Browser

**Cause:** CORS not configured correctly

**Fix:**

1. Add your domain to `AllowedOrigins`
2. Include `http://localhost:3000` for testing
3. Wait 5 minutes for changes to propagate

### Files Upload But Can't Access

**Cause:** Missing signed URL or incorrect permissions

**Fix:**

1. Check signed URL generation in logs
2. Verify `s3:GetObject` permission
3. Test signed URL directly in browser

### Slow Upload Speeds

**Cause:** Region mismatch or large files

**Fix:**

1. Choose region closest to users
2. Implement client-side compression
3. Use multipart upload for files >100MB

---

## Migration Between Providers

### R2 to S3 (or vice versa)

1. Use `rclone` to sync buckets:

```bash
rclone sync r2:tripsync-uploads s3:tripsync-uploads
```

2. Update environment variables
3. Test thoroughly
4. Cut over DNS/config
5. Keep old bucket for 30 days

---

## Advanced: CDN Setup

For better performance, put CloudFlare in front of your storage:

1. Add CloudFlare to your domain
2. Create CNAME: `uploads.yourdomain.com` → your R2/S3 bucket
3. Enable caching in CloudFlare
4. Update `R2_PUBLIC_URL` or add CDN URL

**Benefits:**

- Faster global access
- Lower bandwidth costs
- DDoS protection
- Image optimization

---

## Cost Optimization Tips

1. **Use R2** instead of S3 (saves 90% on egress)
2. **Compress images** before upload (client-side)
3. **Set retention policies** - delete old files
4. **Monitor usage** - set up billing alerts
5. **Use CloudFlare CDN** - cache frequently accessed files

---

## Next Steps

1. Choose provider (R2 recommended)
2. Create bucket and generate credentials
3. Add environment variables
4. Test uploads: `npm run test:services`
5. Deploy and monitor

**Without storage, photo/document features are disabled but app still works.**
