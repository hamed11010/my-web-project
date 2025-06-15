// routes/promoRoutes.js
import express from 'express';
import {
    //getPromos,
    createPromo,
    //updatePromo,
    //deletePromo,
    applyPromo,
    checkPromoUsage
} from '../controllers/promoController.js';

const router = express.Router();

// Promo routes
//router.get('/', getPromos);
router.post('/', createPromo);
//router.put('/:id', updatePromo);
//router.delete('/:id', deletePromo);
router.post('/apply', applyPromo);
router.get('/check/:code', checkPromoUsage);

export default router;
