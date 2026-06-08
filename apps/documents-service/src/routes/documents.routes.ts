import { Router, Router as ExpressRouter } from 'express';
import { documentsController } from '../controllers/documents.controller';
import { requireAuth } from '@mobiwave/shared';

const router: ExpressRouter = Router();

router.post('/upload-url', requireAuth, (req, res, next) => documentsController.getUploadUrl(req, res, next));
router.post('/confirm', requireAuth, (req, res, next) => documentsController.confirmUpload(req, res, next));
router.get('/:id/download-url', requireAuth, (req, res, next) => documentsController.getDownloadUrl(req, res, next));
router.delete('/:id', requireAuth, (req, res, next) => documentsController.deleteDocument(req, res, next));
router.get('/', requireAuth, (req, res, next) => documentsController.listDocuments(req, res, next));

export { router as documentRoutes };
