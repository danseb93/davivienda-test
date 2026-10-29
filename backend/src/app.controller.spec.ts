import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller.js';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('getStatus', () => {
    it('should return the API status', () => {
      expect(appController.getStatus()).toEqual({
        success: true,
        message: 'Davivienda Test is running!',
        statusCode: 200,
        data: null,
      });
    });
  });
});
