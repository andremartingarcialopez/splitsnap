import { Router } from 'express';
import { productController } from '../controllers/product.controller';

export const productRouter = Router();

productRouter.post('/', (req, res, next) => productController.create(req, res, next));
productRouter.put('/:id', (req, res, next) => productController.update(req, res, next));
productRouter.delete('/:id', (req, res, next) => productController.remove(req, res, next));
