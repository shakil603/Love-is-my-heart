"use client";

import { Check, PhoneOff, ShieldCheck } from "lucide-react";
import { Modal } from "@/components/ui";

export default function SafetyModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Modal open={open} onClose={onClose} label="Love Is My Heart safety centre" className="safety-modal">
      <div className="safety-modal-header">
        <span>
          <ShieldCheck size={28} />
        </span>
        <div>
          <span className="eyebrow dark">The Love Is My Heart safety playbook</span>
          <h2>Trust your pace.</h2>
          <p>Practical steps for looking after yourself and the person you are meeting.</p>
        </div>
      </div>
      <div className="safety-playbook">
        <article>
          <span>01</span>
          <div>
            <h3>Keep early conversations here</h3>
            <p>
              There is no need to share your phone number, home address, workplace or
              financial details. Be wary of anyone who pressures you to move elsewhere
              immediately.
            </p>
          </div>
        </article>
        <article>
          <span>02</span>
          <div>
            <h3>Make the first meeting public</h3>
            <p>
              Choose a familiar café, gallery or busy public place. Arrange your own
              transport, tell a trusted person the plan and keep your phone charged.
            </p>
          </div>
        </article>
        <article>
          <span>03</span>
          <div>
            <h3>Watch consistency, not intensity</h3>
            <p>
              Take time to notice whether words and actions line up. Love-bombing, guilt,
              urgency and requests for money are reasons to step back—not hurdles to
              overcome.
            </p>
          </div>
        </article>
        <article>
          <span>04</span>
          <div>
            <h3>You can leave at any point</h3>
            <p>
              You never owe someone continued conversation, a second date or an explanation
              for discomfort. Ask venue staff for help if you feel unsafe.
            </p>
          </div>
        </article>
      </div>
      <div className="safety-emergency">
        <PhoneOff size={20} />
        <p>
          <strong>Immediate danger?</strong> Contact local emergency services. Love Is My Heart does
          not provide emergency response or crisis support.
        </p>
      </div>
      <button className="button button-dark" onClick={onClose}>
        I understand <Check size={17} />
      </button>
    </Modal>
  );
}
