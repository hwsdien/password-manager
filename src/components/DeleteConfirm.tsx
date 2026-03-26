import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface Props {
  t: (key: string) => string;
  open: boolean;
  title?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteConfirm({ t, open, onConfirm, onCancel }: Props) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('vault.delete_confirm')}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          {t('vault.delete_confirm_msg')}
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>{t('vault.delete_cancel')}</Button>
          <Button variant="destructive" onClick={onConfirm}>{t('vault.delete')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
