import type { NextFunction, Request, Response } from 'express';
import { productService } from '../modules/product/product.service';
import {
  createProductSchema,
  updateProductSchema,
} from '../validators/product.validator';
import { sendSuccess } from '../utils/response';

export class ProductController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = createProductSchema.parse(req.body);
      const product = await productService.create(body);
      sendSuccess(res, product, 'Product created', 201);
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = updateProductSchema.parse(req.body);
      const product = await productService.update(req.params.id, body);
      sendSuccess(res, product, 'Product updated');
    } catch (err) {
      next(err);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await productService.remove(req.params.id);
      sendSuccess(res, result, 'Product deleted');
    } catch (err) {
      next(err);
    }
  }
}

export const productController = new ProductController();
