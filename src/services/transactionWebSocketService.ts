import { connectWebSocketClient } from '@stacks/blockchain-api-client';
import { STACKS_API_URL, STACKS_WS_URL } from '@/lib/constants';

export type TxStatus = 'pending' | 'submitted' | 'in_mempool' | 'success' | 'failed';

export interface TxUpdateCallback {
  (status: TxStatus, data?: any): void;
}

class TransactionWebSocketService {
  private pollingIntervals: Map<string, ReturnType<typeof setInterval>> = new Map();
  private callbacks: Map<string, TxUpdateCallback> = new Map();

  private mapTxStatus(apiStatus: string): TxStatus {
    switch (apiStatus) {
      case 'pending':
        return 'in_mempool';
      case 'success':
        return 'success';
      case 'abort_by_response':
      case 'abort_by_post_condition':
        return 'failed';
      default:
        return 'in_mempool';
    }
  }

  async subscribeToTransaction(txid: string, callback: TxUpdateCallback): Promise<void> {
    this.callbacks.set(txid, callback);
    callback('submitted');

    // Normalize txid to have 0x prefix
    const normalizedTxid = txid.startsWith('0x') ? txid : `0x${txid}`;

    // Try WebSocket first, fall back to polling
    try {
      const client = await connectWebSocketClient(`${STACKS_WS_URL}/`);
      
      const sub = await client.subscribeTxUpdates(normalizedTxid, (event: any) => {
        console.log('WS tx update:', event);
        const cb = this.callbacks.get(txid);
        if (!cb) return;

        const status = this.mapTxStatus(event.tx_status);
        cb(status, event);

        if (status === 'success' || status === 'failed') {
          sub.unsubscribe();
          this.callbacks.delete(txid);
        }
      });

      console.log('WebSocket subscription active for', normalizedTxid);
    } catch (error) {
      console.warn('WebSocket failed, falling back to polling:', error);
      this.startPolling(txid, normalizedTxid);
    }
  }

  private startPolling(txid: string, normalizedTxid: string): void {
    // Poll every 10 seconds
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`${STACKS_API_URL}/extended/v1/tx/${normalizedTxid}`);
        if (!response.ok) return; // tx not yet indexed

        const data = await response.json();
        const cb = this.callbacks.get(txid);
        if (!cb) {
          clearInterval(interval);
          this.pollingIntervals.delete(txid);
          return;
        }

        const status = this.mapTxStatus(data.tx_status);
        cb(status, data);

        if (status === 'success' || status === 'failed') {
          clearInterval(interval);
          this.pollingIntervals.delete(txid);
          this.callbacks.delete(txid);
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 10000);

    this.pollingIntervals.set(txid, interval);
  }

  unsubscribe(txid: string): void {
    this.callbacks.delete(txid);
    const interval = this.pollingIntervals.get(txid);
    if (interval) {
      clearInterval(interval);
      this.pollingIntervals.delete(txid);
    }
  }

  disconnect(): void {
    this.callbacks.clear();
    this.pollingIntervals.forEach((interval) => clearInterval(interval));
    this.pollingIntervals.clear();
  }
}

export const transactionWebSocketService = new TransactionWebSocketService();
