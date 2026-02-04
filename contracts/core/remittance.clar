;; Lumenda Remittance Contract
;; Main contract for handling remittance transfers
;; Single Responsibility: Manage transfer lifecycle (initiate, complete, cancel)

(define-map transfers
    {transfer-id: uint}
    {
        sender: principal,
        recipient: principal,
        amount: uint,
        fee: uint,
        created-at: uint,
        completed-at: (optional uint),
        cancelled-at: (optional uint),
        status: (string-ascii 20)
    }
)

;; Transfer status constants
(define-constant STATUS-PENDING "pending")
(define-constant STATUS-COMPLETED "completed")
(define-constant STATUS-CANCELLED "cancelled")

;; Transfer counter for unique IDs
(define-data-var transfer-counter uint u0)

;; Contract owner (for administrative functions)
(define-constant contract-owner tx-sender)

;; Contract pause state
(define-data-var is-paused bool false)

;; Base fee rate (in basis points, e.g., 100 = 1%)
(define-data-var base-fee-rate uint u100)

;; Error codes
(define-constant ERR-TRANSFER-NOT-FOUND (err u100))
(define-constant ERR-TRANSFER-ALREADY-COMPLETED (err u101))
(define-constant ERR-TRANSFER-ALREADY-CANCELLED (err u102))
(define-constant ERR-TRANSFER-INVALID-STATUS (err u103))
(define-constant ERR-TRANSFER-SENDER-RECIPIENT-SAME (err u106))
(define-constant ERR-UNAUTHORIZED (err u300))
(define-constant ERR-NOT-OWNER (err u301))
(define-constant ERR-CONTRACT-PAUSED (err u303))
(define-constant ERR-INVALID-INPUT (err u400))
(define-constant ERR-AMOUNT-ZERO (err u403))

;; ============================================
;; Private Helper Functions
;; ============================================

;; Calculate fee for a transfer amount
;; @param amount: Transfer amount in micro-STX
;; @return: Fee amount in micro-STX
(define-private (calculate-fee (amount uint))
    (/ (* amount (var-get base-fee-rate)) u10000)
)

;; Generate next transfer ID
;; @return: Next unique transfer ID
(define-private (get-next-transfer-id)
    (let ((next-id (+ (var-get transfer-counter) u1)))
        (begin
            (var-set transfer-counter next-id)
            next-id
        )
    )
)

;; Validate transfer can be completed
;; @param transfer: Transfer data
;; @return: true if valid, error otherwise
(define-private (can-complete-transfer (transfer {sender: principal, recipient: principal, amount: uint, fee: uint, created-at: uint, completed-at: (optional uint), cancelled-at: (optional uint), status: (string-ascii 20)}))
    (begin
        (asserts! (is-eq (get status transfer) STATUS-PENDING) ERR-TRANSFER-INVALID-STATUS)
        (asserts! (is-none (get cancelled-at transfer)) ERR-TRANSFER-ALREADY-CANCELLED)
        (ok true)
    )
)

;; Validate transfer can be cancelled
;; @param transfer: Transfer data
;; @return: true if valid, error otherwise
(define-private (can-cancel-transfer (transfer {sender: principal, recipient: principal, amount: uint, fee: uint, created-at: uint, completed-at: (optional uint), cancelled-at: (optional uint), status: (string-ascii 20)}))
    (begin
        (asserts! (is-eq (get status transfer) STATUS-PENDING) ERR-TRANSFER-INVALID-STATUS)
        (asserts! (is-none (get completed-at transfer)) ERR-TRANSFER-ALREADY-COMPLETED)
        (ok true)
    )
)

;; ============================================
;; Public Functions
;; ============================================

;; Initiate a new remittance transfer
;; @param recipient: Principal receiving the transfer
;; @param amount: Amount to transfer (in micro-STX, excluding fee)
;; @return: (ok transfer-id) if successful, error otherwise
(define-public (initiate-transfer
    (recipient principal)
    (amount uint)
)
    (let ((sender tx-sender))
        (begin
            ;; Check if contract is paused
            (asserts! (not (var-get is-paused)) ERR-CONTRACT-PAUSED)
            
            ;; Validate inputs
            (asserts! (> amount u0) ERR-AMOUNT-ZERO)
            (asserts! (is-eq sender recipient) ERR-TRANSFER-SENDER-RECIPIENT-SAME)
            
            ;; Calculate fee
            (let ((fee (calculate-fee amount))
                  (total-amount (+ amount fee))
                  (transfer-id (get-next-transfer-id)))
                (begin
                    ;; Transfer STX from sender to contract (amount + fee)
                    (try! (stx-transfer? total-amount sender (as-contract tx-sender)))
                    
                    ;; Lock funds in escrow (using escrow contract)
                    ;; Note: Escrow contract will be deployed separately and referenced
                    (try! (contract-call? .escrow lock-funds transfer-id sender recipient amount))
                    
                    ;; Create transfer record
                    (map-set transfers
                        {transfer-id: transfer-id}
                        {
                            sender: sender,
                            recipient: recipient,
                            amount: amount,
                            fee: fee,
                            created-at: block-height,
                            completed-at: none,
                            cancelled-at: none,
                            status: STATUS-PENDING
                        }
                    )
                    
                    (ok transfer-id)
                )
            )
        )
    )
)

;; Complete a remittance transfer
;; @param transfer-id: Unique identifier for the transfer
;; @return: (ok true) if successful, error otherwise
(define-public (complete-transfer (transfer-id uint))
    (let ((transfer (unwrap! (map-get? transfers {transfer-id: transfer-id}) ERR-TRANSFER-NOT-FOUND)))
        (begin
            ;; Check if contract is paused
            (asserts! (not (var-get is-paused)) ERR-CONTRACT-PAUSED)
            
            ;; Validate transfer can be completed
            (try! (can-complete-transfer transfer))
            
            ;; Verify caller is the recipient
            (asserts! (is-eq tx-sender (get recipient transfer)) ERR-UNAUTHORIZED)
            
            ;; Release funds from escrow to recipient
            (try! (contract-call? .escrow release-funds transfer-id))
            
            ;; Update transfer status
            (map-set transfers
                {transfer-id: transfer-id}
                (merge transfer {
                    status: STATUS-COMPLETED,
                    completed-at: (some block-height)
                })
            )
            
            (ok true)
        )
    )
)

;; Cancel a remittance transfer
;; @param transfer-id: Unique identifier for the transfer
;; @return: (ok true) if successful, error otherwise
(define-public (cancel-transfer (transfer-id uint))
    (let ((transfer (unwrap! (map-get? transfers {transfer-id: transfer-id}) ERR-TRANSFER-NOT-FOUND)))
        (begin
            ;; Check if contract is paused
            (asserts! (not (var-get is-paused)) ERR-CONTRACT-PAUSED)
            
            ;; Validate transfer can be cancelled
            (try! (can-cancel-transfer transfer))
            
            ;; Verify caller is the sender
            (asserts! (is-eq tx-sender (get sender transfer)) ERR-UNAUTHORIZED)
            
            ;; Refund funds from escrow back to sender
            (try! (contract-call? .escrow refund-funds transfer-id))
            
            ;; Refund fee to sender
            (try! (as-contract (stx-transfer? (get fee transfer) tx-sender (get sender transfer))))
            
            ;; Update transfer status
            (map-set transfers
                {transfer-id: transfer-id}
                (merge transfer {
                    status: STATUS-CANCELLED,
                    cancelled-at: (some block-height)
                })
            )
            
            (ok true)
        )
    )
)

;; ============================================
;; Administrative Functions
;; ============================================

;; Pause the contract (emergency stop)
;; @return: (ok true) if successful, error otherwise
(define-public (pause-contract)
    (begin
        (asserts! (is-eq tx-sender contract-owner) ERR-NOT-OWNER)
        (var-set is-paused true)
        (ok true)
    )
)

;; Unpause the contract
;; @return: (ok true) if successful, error otherwise
(define-public (unpause-contract)
    (begin
        (asserts! (is-eq tx-sender contract-owner) ERR-NOT-OWNER)
        (var-set is-paused false)
        (ok true)
    )
)

;; Update base fee rate (owner only)
;; @param new-rate: New fee rate in basis points (e.g., 100 = 1%)
;; @return: (ok true) if successful, error otherwise
(define-public (set-fee-rate (new-rate uint))
    (begin
        (asserts! (is-eq tx-sender contract-owner) ERR-NOT-OWNER)
        (asserts! (<= new-rate u1000) ERR-INVALID-INPUT) ;; Max 10%
        (var-set base-fee-rate new-rate)
        (ok true)
    )
)

;; ============================================
;; Read-Only Functions
;; ============================================

;; Get transfer information
;; @param transfer-id: Unique identifier for the transfer
;; @return: Transfer information or none
(define-read-only (get-transfer (transfer-id uint))
    (map-get? transfers {transfer-id: transfer-id})
)

;; Get transfer status
;; @param transfer-id: Unique identifier for the transfer
;; @return: Transfer status or none
(define-read-only (get-transfer-status (transfer-id uint))
    (match (map-get? transfers {transfer-id: transfer-id})
        transfer (some (get status transfer))
        none
    )
)

;; Get contract owner
;; @return: Contract owner principal
(define-read-only (get-owner)
    contract-owner
)

;; Get current fee rate
;; @return: Fee rate in basis points
(define-read-only (get-fee-rate)
    (var-get base-fee-rate)
)

;; Check if contract is paused
;; @return: true if paused, false otherwise
(define-read-only (get-paused-status)
    (var-get is-paused)
)

;; Get total number of transfers
;; @return: Total transfer count
(define-read-only (get-transfer-count)
    (var-get transfer-counter)
)
