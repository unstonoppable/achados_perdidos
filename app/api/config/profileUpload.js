import multer from 'multer';
import path from 'path';

// Configuração de armazenamento para fotos de perfil
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/profile_pictures/');
  },
  filename: (req, file, cb) => {
    const userId = req.session.user.id;
    const uniqueSuffix = Date.now();
    const newFileName = `profile-${userId}-${uniqueSuffix}${path.extname(file.originalname)}`;
    cb(null, newFileName);
  }
});

// Filtro de arquivo para aceitar apenas imagens
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  if (allowedTypes.test(file.mimetype) && allowedTypes.test(path.extname(file.originalname).toLowerCase())) {
    return cb(null, true);
  }
  cb(new Error('Apenas imagens são permitidas (jpeg, jpg, png, gif).'));
};

const profileUpload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 5 }, // Limite de 5MB
  fileFilter: fileFilter
});

export default profileUpload; 