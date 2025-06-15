import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get all available images from the project-images directory
export const getAvailableImages = () => {
    const imagesDir = path.join(__dirname, '../public/images/project-images');
    try {
        const files = fs.readdirSync(imagesDir);
        return files.filter(file => {
            const ext = path.extname(file).toLowerCase();
            return ['.jpg', '.jpeg', '.png', '.gif'].includes(ext);
        });
    } catch (error) {
        console.error('Error reading images directory:', error);
        return [];
    }
};

// Get image URL for a given image name
export const getImageUrl = (imageName) => {
    return `/images/project-images/${imageName}`;
};

// Get image preview URL (thumbnail)
export const getImagePreviewUrl = (imageName) => {
    return `/images/project-images/${imageName}`;
}; 