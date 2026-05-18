import { Request, Response, NextFunction } from 'express';

export default class AgreementController {
  static async getAgreement(req: Request, res: Response, next: NextFunction) {
    try {
      const agreement = {
        version: '1.0.0',
        url: 'https://example.com/agreement/terms-and-conditions.pdf'
      };
      res.status(200).json(agreement);
    } catch (error) {
      next(error);
    }
  }
}
