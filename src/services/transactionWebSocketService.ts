import { STACKS_WS_URL } from '@/lib/constants';

export type TxStatus = 'pending' | 'submitted' | 'in_mempool' | 'success' | 'failed';

export interface TxUpdateCallback {
  (status: TxStatus, data?: any): void;
}

class TransactionWebSocketService {
  private socket: WebSocket | null = null;
  private subscriptions: Map<string, TxUpdateCallback> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;

  private connect(): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
      if (this.socket?.readyState === WebSocket.OPEN) {
        resolve(this.socket);
        return;
      }

      this.socket = new WebSocket(STACKS_WS_URL);

      this.socket.onopen = () => {
        this.reconnectAttempts = 0;
        resolve(this.socket!);
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        reject(error);
      };

      this.socket.onclose = () => {
        this.socket = null;
        // Attempt reconnect if there are active subscriptions
        if (this.subscriptions.size > 0 && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          setTimeout(() => this.connect(), 1000 * this.reconnectAttempts);
        }
      };
    });
  }

  private handleMessage(data: any) {
    // Handle subscription confirmation
    if (data.id && data.result) {
      return;
    }

    // Handle transaction update
    if (data.params?.result) {
      const txData = data.params.result;
      const txid = txData.tx_id;
      const callback = this.subscriptions.get(txid);

      if (callback) {
        const status = this.mapTxStatus(txData.tx_status);
        callback(status, txData);

        // Unsubscribe on final status
        if (status === 'success' || status === 'failed') {
          this.unsubscribe(txid);
        }
      }
    }
  }

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
        return 'pending';
    }
  }

  async subscribeToTransaction(txid: string, callback: TxUpdateCallback): Promise<void> {
    try {
      const socket = await this.connect();
      
      this.subscriptions.set(txid, callback);

      // Subscribe to transaction updates
      const subscribeMessage = {
        jsonrpc: '2.0',
        id: `sub-${txid}`,
        method: 'subscribe',
        params: {
          event: 'tx_update',
          tx_id: txid,
        },
      };

      socket.send(JSON.stringify(subscribeMessage));
      
      // Immediately mark as submitted
      callback('submitted');
    } catch (error) {
      console.error('Failed to subscribe to transaction:', error);
      callback('failed');
    }
  }

  unsubscribe(txid: string): void {
    this.subscriptions.delete(txid);

    if (this.socket?.readyState === WebSocket.OPEN) {
      const unsubscribeMessage = {
        jsonrpc: '2.0',
        id: `unsub-${txid}`,
        method: 'unsubscribe',
        params: {
          event: 'tx_update',
          tx_id: txid,
        },
      };

      this.socket.send(JSON.stringify(unsubscribeMessage));
    }

    // Close socket if no more subscriptions
    if (this.subscriptions.size === 0) {
      this.socket?.close();
    }
  }

  disconnect(): void {
    this.subscriptions.clear();
    this.socket?.close();
    this.socket = null;
  }
}

export const transactionWebSocketService = new TransactionWebSocketService();
