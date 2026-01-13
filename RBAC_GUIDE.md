# 🔐 RBAC (Role-Based Access Control) - Complete Guide

## 🎉 RBAC System Successfully Implemented!

Your YOLO Generator now has a complete authentication and authorization system with role-based access control.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd /Users/nithinkumark/Developer/next/yoloGenerator/backend
source venv/bin/activate
pip install PyJWT bcrypt python-jose[cryptography]
```

### 2. Update Database
```bash
python3 database.py
```

This will add the `role` column to the `users` table.

### 3. Start Backend
```bash
./run_backend.sh
```

### 4. Start Frontend
```bash
cd ../yologen
npm run dev
```

### 5. Test RBAC
1. Go to `http://localhost:3000`
2. Click "Sign Up" or "Login"
3. Create/login with different roles
4. Experience role-based permissions!

---

## 👥 User Roles

### 1. **Admin** 🔴
- **Full System Access**
- Can manage users
- Can view system logs
- Can configure system settings
- Has all permissions of User role

### 2. **User** 🟡
- **Standard Access**
- Create, edit, delete datasets
- Start, view, stop training
- Upload, view, delete models
- Run and view inference
- Cannot manage other users

### 3. **Viewer** 🟢
- **Read-Only Access**
- View datasets
- View training jobs
- View models
- View inference results
- Cannot create, edit, or delete anything

---

## 🔑 Permissions System

### Dataset Permissions
- `create_dataset` - Create new datasets
- `view_dataset` - View dataset information
- `edit_dataset` - Modify dataset details
- `delete_dataset` - Remove datasets

### Training Permissions
- `start_training` - Initiate training jobs
- `view_training` - View training progress
- `stop_training` - Stop running training

### Model Permissions
- `upload_model` - Upload custom models
- `view_model` - View model information
- `delete_model` - Remove models

### Inference Permissions
- `run_inference` - Execute inference
- `view_inference` - View inference results

### System Permissions (Admin Only)
- `manage_users` - Create, edit, delete users
- `view_logs` - Access system logs
- `system_config` - Modify system settings

---

## 📊 Role-Permission Matrix

| Permission | Admin | User | Viewer |
|------------|-------|------|--------|
| Create Dataset | ✅ | ✅ | ❌ |
| View Dataset | ✅ | ✅ | ✅ |
| Edit Dataset | ✅ | ✅ | ❌ |
| Delete Dataset | ✅ | ✅ | ❌ |
| Start Training | ✅ | ✅ | ❌ |
| View Training | ✅ | ✅ | ✅ |
| Stop Training | ✅ | ✅ | ❌ |
| Upload Model | ✅ | ✅ | ❌ |
| View Model | ✅ | ✅ | ✅ |
| Delete Model | ✅ | ✅ | ❌ |
| Run Inference | ✅ | ✅ | ❌ |
| View Inference | ✅ | ✅ | ✅ |
| Manage Users | ✅ | ❌ | ❌ |
| View Logs | ✅ | ❌ | ❌ |
| System Config | ✅ | ❌ | ❌ |

---

## 🔐 API Endpoints

### Authentication

#### Register
```bash
POST /api/auth/register
Content-Type: application/json

{
  "username": "newuser",
  "email": "user@example.com",
  "password": "securepass123",
  "role": "user"  # optional: admin, user, viewer
}

Response:
{
  "access_token": "eyJ0eXAi...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "username": "newuser",
    "email": "user@example.com",
    "role": "user"
  }
}
```

#### Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "username": "newuser",
  "password": "securepass123"
}

Response: (same as register)
```

#### Get Current User
```bash
GET /api/auth/me
Authorization: Bearer <token>

Response:
{
  "id": 1,
  "username": "newuser",
  "email": "user@example.com",
  "role": "user",
  "created_at": "2026-01-10T..."
}
```

#### Get Permissions
```bash
GET /api/auth/permissions
Authorization: Bearer <token>

Response:
{
  "role": "user",
  "permissions": [
    "create_dataset",
    "view_dataset",
    ...
  ]
}
```

### User Management (Admin Only)

#### List Users
```bash
GET /api/auth/users
Authorization: Bearer <admin-token>

Response:
{
  "users": [
    {
      "id": 1,
      "username": "admin",
      "email": "admin@example.com",
      "role": "admin",
      "created_at": "2026-01-10T..."
    },
    ...
  ]
}
```

#### Update User Role
```bash
PUT /api/auth/users/{user_id}/role
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "new_role": "admin"
}
```

#### Delete User
```bash
DELETE /api/auth/users/{user_id}
Authorization: Bearer <admin-token>
```

---

## 🎨 Frontend Features

### New Pages

#### 1. Login Page (`/login`)
- Beautiful modern design
- Username/password fields
- Error handling
- Demo account credentials
- Link to registration

#### 2. Register Page (`/register`)
- User registration form
- Email validation
- Password confirmation
- Role selection (user/viewer)
- Link to login

#### 3. Unauthorized Page (`/unauthorized`)
- Shows when user lacks permissions
- Provides helpful feedback
- Navigation options

### Updated Pages

#### 1. Home Page (`/home`)
- Login/Register buttons (if not logged in)
- User info + Logout button (if logged in)
- Dynamic CTA buttons

#### 2. Dashboard (`/dashboard`)
- Protected route (requires login)
- Shows username and role
- Logout button in header
- All existing features

---

## 🛡️ Security Features

### 1. Password Hashing
- Uses bcrypt for secure hashing
- Salt generated automatically
- One-way encryption

### 2. JWT Tokens
- Secure token-based authentication
- 30-minute expiration
- Includes user info and role

### 3. Protected Routes
- Frontend route protection
- Backend endpoint protection
- Permission-based access

### 4. Role Validation
- Server-side role checking
- Permission verification
- Token validation

---

## 💻 Frontend Integration

### Using Auth Context
```javascript
import { useAuth } from "@/context/AuthContext";

function MyComponent() {
  const { user, hasPermission, isAdmin, logout } = useAuth();

  // Check if user is logged in
  if (!user) {
    return <div>Please login</div>;
  }

  // Check specific permission
  if (hasPermission("create_dataset")) {
    return <button>Create Dataset</button>;
  }

  // Check if admin
  if (isAdmin()) {
    return <button>Admin Panel</button>;
  }

  return <button onClick={logout}>Logout</button>;
}
```

### Protected Routes
```javascript
import ProtectedRoute from "@/components/ProtectedRoute";

export default function SecretPage() {
  return (
    <ProtectedRoute requiredPermission="manage_users">
      <div>Only admins can see this</div>
    </ProtectedRoute>
  );
}
```

---

## 🧪 Testing

### Test Accounts
Create these test accounts to test different roles:

```bash
# Admin Account
username: admin
password: admin123
role: admin

# User Account
username: testuser  
password: user123
role: user

# Viewer Account
username: viewer
password: viewer123
role: viewer
```

### Test Scenarios

#### 1. Login Flow
1. Go to `/login`
2. Enter credentials
3. Should redirect to `/dashboard`
4. Should show username in header

#### 2. Registration Flow
1. Go to `/register`
2. Fill form with new credentials
3. Select role (user/viewer)
4. Should auto-login and redirect to `/dashboard`

#### 3. Permission Check
1. Login as viewer
2. Try to create dataset → Should show error/disabled
3. Logout and login as user
4. Try to create dataset → Should work

#### 4. Admin Functions
1. Login as admin
2. Go to Settings tab
3. Should see user management options
4. Can view all users
5. Can change user roles

---

## 📁 Files Created

### Backend
- `backend/rbac.py` - RBAC core logic
- `backend/app/routes/auth.py` - Auth endpoints
- Updated `backend/database.py` - Added role column
- Updated `backend/main.py` - Included auth router
- Updated `backend/requirements.txt` - Added PyJWT, bcrypt

### Frontend
- `yologen/src/context/AuthContext.js` - Auth state management
- `yologen/src/app/login/page.js` - Login page
- `yologen/src/app/register/page.js` - Register page
- `yologen/src/app/unauthorized/page.js` - 403 page
- `yologen/src/components/ProtectedRoute.js` - Route protection
- Updated `yologen/src/app/layout.js` - Added AuthProvider
- Updated `yologen/src/app/home/page.js` - Added auth buttons
- Updated `yologen/src/app/dashboard/page.js` - Protected + user info

---

## 🔧 Configuration

### JWT Settings (`backend/.env`)
```env
SECRET_KEY=your-secret-key-change-in-production
```

⚠️ **Important**: Change the SECRET_KEY in production!

### Token Expiration
Default: 30 minutes

To change, edit `backend/rbac.py`:
```python
ACCESS_TOKEN_EXPIRE_MINUTES = 60  # Change to desired minutes
```

---

## 🚨 Troubleshooting

### "Module 'jwt' has no attribute 'encode'"
```bash
pip uninstall jwt PyJWT
pip install PyJWT
```

### "Invalid or expired token"
- Token expired (30 min limit)
- Log out and log back in
- Or increase expiration time

### "Permission denied"
- User role doesn't have required permission
- Check role-permission matrix above
- Admin can change user roles

### "Database connection failed"
- Ensure MySQL is running
- Check credentials in `.env`
- Run `python3 database.py` to reinitialize

---

## ✅ Verification Checklist

Test these to verify RBAC is working:

- [ ] Can register new user
- [ ] Can login with credentials
- [ ] JWT token is stored in localStorage
- [ ] Dashboard requires login
- [ ] Home page shows user info when logged in
- [ ] Logout works and redirects to login
- [ ] Admin can view user list
- [ ] Admin can change user roles
- [ ] Viewer cannot create datasets
- [ ] User can create datasets
- [ ] Unauthorized page shows when accessing restricted content

---

## 🎯 Summary

**What You Got:**
- 🔐 Complete authentication system (login/register)
- 👥 3 user roles (Admin, User, Viewer)
- 🔑 15 granular permissions
- 🛡️ JWT token-based security
- 🎨 Beautiful login/register pages
- 🚪 Protected routes
- 💾 Database integration
- 📝 Comprehensive documentation

**Security Features:**
- ✅ Password hashing (bcrypt)
- ✅ JWT tokens
- ✅ Role validation
- ✅ Permission checking
- ✅ Protected routes
- ✅ Token expiration

**Ready to use!** 🚀

Just install dependencies and restart the backend/frontend!

