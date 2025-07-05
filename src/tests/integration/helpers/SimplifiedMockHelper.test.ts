import { SimplifiedMockHelper, withMocks, waitFor } from './SimplifiedMockHelper';
import { jest } from '@jest/globals';

describe('SimplifiedMockHelper', () => {
  let mockHelper: SimplifiedMockHelper;

  beforeEach(() => {
    mockHelper = new SimplifiedMockHelper();
  });

  afterEach(async () => {
    await mockHelper.restoreAll();
  });

  describe('mockProcessExit', () => {
    it('should mock process.exit and restore it', () => {
      const originalExit = process.exit;
      const mockExit = mockHelper.mockProcessExit();
      
      expect(process.exit).toBe(mockExit);
      expect(mockExit).not.toBe(originalExit);
    });
  });

  describe('useFakeTimers', () => {
    it('should enable fake timers', () => {
      mockHelper.useFakeTimers();
      
      const callback = jest.fn();
      setTimeout(callback, 1000);
      
      expect(callback).not.toHaveBeenCalled();
      jest.advanceTimersByTime(1000);
      expect(callback).toHaveBeenCalled();
    });
  });

  describe('createReadlineMock', () => {
    it('should create a functional readline mock', () => {
      const rlMock = mockHelper.createReadlineMock();
      
      const lineHandler = jest.fn();
      rlMock.on('line', lineHandler);
      
      rlMock.simulateInput('test input');
      expect(lineHandler).toHaveBeenCalledWith('test input');
    });
  });

  describe('withMocks helper', () => {
    it('should automatically clean up after test', async () => {
      const originalExit = process.exit;
      
      await withMocks(async (mocks) => {
        const mockExit = mocks.mockProcessExit();
        expect(process.exit).toBe(mockExit);
      })();
      
      expect(process.exit).toBe(originalExit);
    });
  });

  describe('waitFor helper', () => {
    it('should wait for condition to become true', async () => {
      let condition = false;
      setTimeout(() => { condition = true; }, 100);
      
      await waitFor(() => condition, { timeout: 200, interval: 10 });
      expect(condition).toBe(true);
    });

    it('should timeout if condition never becomes true', async () => {
      await expect(
        waitFor(() => false, { timeout: 100 })
      ).rejects.toThrow('Timeout waiting for condition after 100ms');
    });
  });
});