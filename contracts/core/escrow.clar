;; Lumenda Escrow Contract
;; Manages escrow functionality for remittance transfers
;; Single Responsibility: Handle fund locking, release, and refunds

(define-map escrow-balances principal uint)

;; Stores escrow information for each transfer
(define-map escrow-info
  {transfer-id: uint}
  {
    sender: principal,
    recipient: principal,
    amount: uint,
    locked-at: uint,
    status: (string-ascii 20)
  }
)

;; Transfer status constants
(define-constant STATUS-LOCKED "locked")
(define-constant STATUS-RELEASED "released")
(define-constant STATUS-REFUNDED "refunded")

;; Error codes (imported from errors.clar)
(define-constant ERR-ESCROW-NOT-FOUND (err u200))
(define-constant ERR-ESCROW-ALREADY-LOCKED (err u201))
(define-constant ERR-ESCROW-NOT-LOCKED (err u202))
(define-constant ERR-ESCROW-INSUFFICIENT-BALANCE (err u203))
(define-constant ERR-AMOUNT-ZERO (err u403))

;; ============================================
;; Public Functions
;; ============================================

;; Lock funds in escrow for a transfer
;; @param transfer-id: Unique identifier for the transfer
;; @param sender: Principal initiating the transfer
;; @param recipient: Principal receiving the transfer
;; @param amount: Amount to lock in escrow (in micro-STX)
;; @return: (ok true) if successful, error otherwise
(define-public (lock-funds
    (transfer-id uint)
    (sender principal)
    (recipient principal)
    (amount uint)
)
    (begin
        ;; Validate inputs
        (asserts! (> amount u0) ERR-AMOUNT-ZERO)
        (asserts! (not (is-eq sender recipient)) (err u106)) ;; ERR-TRANSFER-SENDER-RECIPIENT-SAME
        
        ;; Check if escrow already exists
        (asserts! (is-none (map-get? escrow-info {transfer-id: transfer-id})) ERR-ESCROW-ALREADY-LOCKED)
        
        ;; Transfer STX from sender to escrow
        (try! (stx-transfer? amount sender (as-contract tx-sender)))
        
        ;; Update escrow balance for sender
        (let ((current-balance (default-to u0 (map-get? escrow-balances sender))))
            (map-set escrow-balances sender (+ current-balance amount))
        )
        
        ;; Store escrow information
        (map-set escrow-info
            {transfer-id: transfer-id}
            {
                sender: sender,
                recipient: recipient,
                amount: amount,
                locked-at: block-height,
                status: STATUS-LOCKED
            }
        )
        
        (ok true)
    )
)

;; Release funds from escrow to recipient
;; @param transfer-id: Unique identifier for the transfer
;; @return: (ok true) if successful, error otherwise
(define-public (release-funds (transfer-id uint))
    (let ((escrow (unwrap! (map-get? escrow-info {transfer-id: transfer-id}) ERR-ESCROW-NOT-FOUND)))
        (begin
            ;; Verify escrow is locked
            (asserts! (is-eq (get status escrow) STATUS-LOCKED) ERR-ESCROW-NOT-LOCKED)
            
            ;; Transfer STX from escrow to recipient
            (try! (as-contract (stx-transfer? (get amount escrow) tx-sender (get recipient escrow))))
            
            ;; Update sender's escrow balance
            (let ((sender (get sender escrow))
                  (amount (get amount escrow))
                  (current-balance (unwrap! (map-get? escrow-balances sender) ERR-ESCROW-INSUFFICIENT-BALANCE)))
                (begin
                    (asserts! (>= current-balance amount) ERR-ESCROW-INSUFFICIENT-BALANCE)
                    (map-set escrow-balances sender (- current-balance amount))
                )
            )
            
            ;; Update escrow status
            (map-set escrow-info
                {transfer-id: transfer-id}
                (merge escrow {
                    status: STATUS-RELEASED
                })
            )
            
            (ok true)
        )
    )
)

;; Refund funds from escrow back to sender
;; @param transfer-id: Unique identifier for the transfer
;; @return: (ok true) if successful, error otherwise
(define-public (refund-funds (transfer-id uint))
    (let ((escrow (unwrap! (map-get? escrow-info {transfer-id: transfer-id}) ERR-ESCROW-NOT-FOUND)))
        (begin
            ;; Verify escrow is locked
            (asserts! (is-eq (get status escrow) STATUS-LOCKED) ERR-ESCROW-NOT-LOCKED)
            
            ;; Transfer STX from escrow back to sender
            (try! (as-contract (stx-transfer? (get amount escrow) tx-sender (get sender escrow))))
            
            ;; Update sender's escrow balance
            (let ((sender (get sender escrow))
                  (amount (get amount escrow))
                  (current-balance (unwrap! (map-get? escrow-balances sender) ERR-ESCROW-INSUFFICIENT-BALANCE)))
                (begin
                    (asserts! (>= current-balance amount) ERR-ESCROW-INSUFFICIENT-BALANCE)
                    (map-set escrow-balances sender (- current-balance amount))
                )
            )
            
            ;; Update escrow status
            (map-set escrow-info
                {transfer-id: transfer-id}
                (merge escrow {
                    status: STATUS-REFUNDED
                })
            )
            
            (ok true)
        )
    )
)

;; ============================================
;; Read-Only Functions
;; ============================================

;; Get escrow information for a transfer
;; @param transfer-id: Unique identifier for the transfer
;; @return: Escrow information or none
(define-read-only (get-escrow-info (transfer-id uint))
    (map-get? escrow-info {transfer-id: transfer-id})
)

;; Get escrow balance for a principal
;; @param account: Principal to check balance for
;; @return: Escrow balance in micro-STX
(define-read-only (get-escrow-balance (account principal))
    (default-to u0 (map-get? escrow-balances account))
)

;; Check if escrow is locked for a transfer
;; @param transfer-id: Unique identifier for the transfer
;; @return: true if locked, false otherwise
(define-read-only (is-escrow-locked (transfer-id uint))
    (match (map-get? escrow-info {transfer-id: transfer-id})
        escrow (is-eq (get status escrow) STATUS-LOCKED)
        false
    )
)
