import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2, XCircle, Loader2, ExternalLink, Zap, Lock } from 'lucide-react';
import { TxStatus } from '@/services/transactionWebSocketService';
import { EXPLORER_TX_BASE_URL, FAST_POOL_URL, NETWORK } from '@/lib/constants';

interface TransactionStatusDialogProps {
  isOpen: boolean;
  onClose: () => void;
  txid: string | null;
  status: TxStatus;
}

const statusConfig: Record<TxStatus, { label: string; description: string }> = {
  pending: {
    label: 'Waiting for signature...',
    description: 'Please confirm the transaction in your wallet',
  },
  submitted: {
    label: 'Transaction submitted',
    description: 'Broadcasting to the network...',
  },
  in_mempool: {
    label: 'In mempool',
    description: 'Waiting for block confirmation...',
  },
  success: {
    label: 'Transaction confirmed!',
    description: 'Your swap was successful',
  },
  failed: {
    label: 'Transaction failed',
    description: 'The transaction could not be completed',
  },
};

const steps = [
  { id: 'submitted', label: 'Submitted' },
  { id: 'in_mempool', label: 'In Mempool' },
  { id: 'success', label: 'Confirmed' },
];

function getStepStatus(step: string, currentStatus: TxStatus): 'complete' | 'current' | 'pending' {
  const order = ['pending', 'submitted', 'in_mempool', 'success'];
  const stepIndex = order.indexOf(step);
  const currentIndex = order.indexOf(currentStatus);

  if (currentStatus === 'failed') return 'pending';
  if (stepIndex < currentIndex) return 'complete';
  if (stepIndex === currentIndex) return 'current';
  return 'pending';
}

export function TransactionStatusDialog({
  isOpen,
  onClose,
  txid,
  status,
}: TransactionStatusDialogProps) {
  const config = statusConfig[status];
  const explorerUrl = txid ? `${EXPLORER_TX_BASE_URL}/${txid}?chain=${NETWORK}` : null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Transaction Status</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status Icon and Text */}
          <div className="flex flex-col items-center gap-3 py-4">
            {status === 'success' ? (
              <CheckCircle2 className="h-12 w-12 text-green-500" />
            ) : status === 'failed' ? (
              <XCircle className="h-12 w-12 text-destructive" />
            ) : (
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            )}
            <div className="text-center">
              <p className="font-semibold text-lg">{config.label}</p>
              <p className="text-sm text-muted-foreground">{config.description}</p>
            </div>
          </div>

          {/* Progress Steps */}
          {status !== 'failed' && (
            <div className="flex justify-between px-4">
              {steps.map((step, index) => {
                const stepStatus = getStepStatus(step.id, status);
                return (
                  <div key={step.id} className="flex flex-col items-center gap-2">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                        stepStatus === 'complete'
                          ? 'bg-green-500 text-white'
                          : stepStatus === 'current'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {stepStatus === 'complete' ? '✓' : index + 1}
                    </div>
                    <span className="text-xs text-muted-foreground">{step.label}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Explorer Link */}
          {explorerUrl && (
            <div className="flex justify-center">
              <a
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
              >
                View on Explorer
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}

          <Separator />

          {/* Dual Stacking Promo */}
          <div className="space-y-4">
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
              <div className="flex items-start gap-3">
                <Lock className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h3 className="font-semibold text-sm">Unlock More Bitcoin Yield with Dual Stacking</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Lock your STX and hold sBTC to earn enhanced Bitcoin rewards. 
                    Earn ~5-10% APY on your STX while supporting the Stacks network.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-chart-4/20 bg-chart-4/5 p-4">
              <div className="flex items-start gap-3">
                <Zap className="h-5 w-5 text-chart-4 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-sm">Fast Pool - The Original Stacking Pool</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Self-service stacking pool on Stacks. Immediate stacking, STX rewards, 
                    operated by Friedger (same developer as this swap app).
                  </p>
                </div>
              </div>
            </div>

            <Button
              className="w-full"
              onClick={() => window.open(FAST_POOL_URL, '_blank')}
            >
              <Zap className="mr-2 h-4 w-4" />
              Join Fast Pool
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
