# Brass Space Interior Solution - Photo Library 🏠

A comprehensive interior design library application built with React, Firebase, and Vite. Browse, organize, and manage thousands of interior design images and videos across 14+ categories.

## ✨ Features

### 🛠️ Brass Space Interior Solution Suite Tools
- **[Quotation Builder](https://quotationbuilder-d79e9.web.app/)**: Create professional quotations for clients
- **[Mood Board Builder](https://vietual-office.web.app/)**: Create visual mood boards for design projects

### 🎨 Design Categories
- **Kitchen**: L-Shape, U-Shape, Island, Modular, and more
- **Living Area**: TV Units, Wall Panels, Lighting designs
- **Bedroom**: Master, Kids, Guest bedrooms with back panels
- **Dining Area**: Tables, Crockery units, Bar designs
- **Bathroom**: Modern, Luxury, Vanity units
- **Wardrobe**: Sliding, Hinged, Walk-in wardrobes
- **False Ceiling**: Gypsum, POP, Designer ceilings
- **Wall Décor**: CNC designs, Wallpapers, 3D panels
- **Facade/Exterior**: Modern facades, Glass elevations
- **Balcony**: Open, Covered, Garden balconies
- **Temple Room**: Traditional and modern mandir designs
- **Study Room**: Libraries, Study tables, Bookshelves
- **Entertainment**: Home theaters, Gaming rooms
- **Commercial**: Office, Retail, Restaurant interiors
- **Materials**: Laminates, Hardware, Lighting samples

### 🔐 Role-Based Access Control
- **Admin**: Full access - upload, delete, manage users
- **Staff**: View, download, screenshot, share content
- **Client**: View and favorite content only

### 📱 User Experience
- Responsive design for all devices
- Advanced filtering and search
- Favorites system
- Bulk download with ZIP
- Screenshot functionality
- Social sharing
- Analytics dashboard (Admin)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Firebase account
- Firebase CLI: `npm install -g firebase-tools`

### Installation

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd brass-space-interior-library
   npm install
   ```

2. **Firebase Setup**
   ```bash
   npm run setup
   ```

3. **Configure Environment**
   - Edit `.env` with your Firebase configuration
   - See `DEPLOYMENT.md` for detailed setup

4. **Start Development**
   ```bash
   npm run dev
   ```

5. **Deploy**
   ```bash
   npm run deploy
   ```

## 📁 Project Structure

```
brass-space-interior-library/
├── src/
│   ├── components/
│   │   └── Layout/           # Layout components
│   ├── context/
│   │   └── AuthContext.jsx   # Authentication & roles
│   ├── data/
│   │   └── categories.js     # Category definitions
│   ├── firebase/
│   │   └── config.js         # Firebase configuration
│   ├── pages/
│   │   ├── Admin/            # Admin-only pages
│   │   ├── Categories.jsx    # Category browser
│   │   ├── Gallery.jsx       # Media gallery
│   │   ├── Upload.jsx        # Media upload (Admin)
│   │   └── ...
│   ├── App.jsx               # Main app component
│   └── main.jsx              # App entry point
├── firebase.json             # Firebase configuration
├── firestore.rules           # Database security rules
├── storage.rules             # Storage security rules
├── DEPLOYMENT.md             # Deployment guide
```

## 🛠 Technology Stack

- **Frontend**: React 18, React Router, Vite
- **Backend**: Firebase (Auth, Firestore, Storage)
- **UI**: Custom CSS, Framer Motion, Lucide Icons
- **Charts**: Recharts
- **Build**: Vite, TypeScript
- **Deployment**: Firebase Hosting

## 🔧 Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run deploy       # Build and deploy to Firebase
npm run setup        # Initial project setup
```

## 🔒 Security

- **Authentication**: Email/password with Firebase Auth
- **Database**: Role-based Firestore security rules
- **Storage**: Admin-only uploads, authenticated reads
- **Frontend**: Route protection based on user roles

## 📊 Admin Features

- **Analytics Dashboard**: User activity, popular content
- **User Management**: View and manage user roles
- **Category Management**: Add/edit categories and subcategories
- **Media Upload**: Bulk upload with progress tracking
- **Content Organization**: Tag and categorize media

## 🎯 User Roles & Permissions

| Feature | Admin | Staff | Client |
|---------|-------|-------|--------|
| View Content | ✅ | ✅ | ✅ |
| Upload Media | ✅ | ❌ | ❌ |
| Delete Media | ✅ | ❌ | ❌ |
| Download | ✅ | ✅ | ❌ |
| Screenshot | ✅ | ✅ | ❌ |
| Share | ✅ | ✅ | ❌ |
| Favorites | ✅ | ✅ | ✅ |
| Manage Users | ✅ | ❌ | ❌ |
| Analytics | ✅ | ❌ | ❌ |

## 🚀 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deploy
1. Set up Firebase project
2. Configure environment variables
3. Run `npm run deploy`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

- Check [DEPLOYMENT.md](./DEPLOYMENT.md) for setup issues
- Review Firebase Console for backend issues
- Check browser console for frontend errors

## 🔄 Updates

- Regular dependency updates
- New category additions
- Feature enhancements
- Performance optimizations

---

Built with ❤️ by Brass Space Interior Solution