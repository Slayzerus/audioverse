import React from 'react';
import { useTranslation } from 'react-i18next';
import { Focusable } from '../common/Focusable';
import { useGamepadNavigation } from '../../contexts/GamepadNavigationContext';

type ConfirmOptions = { title?: string; ok?: string; cancel?: string };

type ConfirmContext = { confirm: (message: string, opts?: ConfirmOptions) => Promise<boolean> };

const Ctx = React.createContext<ConfirmContext>({ confirm: async () => false });

export const useConfirm = () => React.useContext(Ctx).confirm;

export const ConfirmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [open, setOpen] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const [opts, setOpts] = React.useState<ConfirmOptions>({});
  const resolverRef = React.useRef<(v: boolean) => void>(()=>{});
  const closingRef = React.useRef(false);
  const { pushFocusTrap, popFocusTrap, setActive } = useGamepadNavigation();
  const { t } = useTranslation();

  const confirm = (msg: string, options?: ConfirmOptions) => {
    setMessage(msg);
    setOpts(options ?? {});
    setOpen(true);
    closingRef.current = false;
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  };

  const handle = (val: boolean) => {
    if (closingRef.current) return; // guard against re-entrant calls from onDismiss
    closingRef.current = true;
    setOpen(false);
    popFocusTrap();
    resolverRef.current(val);
  };

  // Push focus trap when dialog opens, auto-focus cancel button
  React.useEffect(() => {
    if (open) {
      pushFocusTrap('confirm-', () => handle(false));
      // Small delay to let Focusable register
      const t = setTimeout(() => setActive('confirm-cancel'), 30);
      return () => clearTimeout(t);
    }
  }, [open, pushFocusTrap, setActive]);

  return (
    <Ctx.Provider value={{ confirm }}>
      {children}
      {open && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="confirm-title" style={{position:'fixed',inset:0,display:'flex',alignItems:'center',justifyContent:'center',zIndex:2000}}>
          <div className="card p-3" style={{minWidth: 'min(320px, 90vw)'}}>
            <div className="card-body">
              <h5 id="confirm-title" className="card-title">{opts.title ?? t('common.confirmation')}</h5>
              <p>{message}</p>
              <div className="d-flex justify-content-end mt-3">
                <Focusable id="confirm-cancel">
                  <button className="btn btn-secondary me-2" onClick={() => handle(false)}>{opts.cancel ?? t('common.cancel')}</button>
                </Focusable>
                <Focusable id="confirm-ok">
                  <button className="btn btn-primary" onClick={() => handle(true)}>{opts.ok ?? t('common.ok')}</button>
                </Focusable>
              </div>
            </div>
          </div>
        </div>
      )}
    </Ctx.Provider>
  );
};

export default ConfirmProvider;
