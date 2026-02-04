;; Error codes for Lumenda contracts
;; Centralized error definitions for consistency across contracts

;; Transfer errors (100-199)
(define-constant ERR-TRANSFER-NOT-FOUND (err u100))
(define-constant ERR-TRANSFER-ALREADY-COMPLETED (err u101))
(define-constant ERR-TRANSFER-ALREADY-CANCELLED (err u102))
(define-constant ERR-TRANSFER-INVALID-STATUS (err u103))
(define-constant ERR-TRANSFER-INVALID-AMOUNT (err u104))
(define-constant ERR-TRANSFER-INVALID-RECIPIENT (err u105))
(define-constant ERR-TRANSFER-SENDER-RECIPIENT-SAME (err u106))

;; Escrow errors (200-299)
(define-constant ERR-ESCROW-NOT-FOUND (err u200))
(define-constant ERR-ESCROW-ALREADY-LOCKED (err u201))
(define-constant ERR-ESCROW-NOT-LOCKED (err u202))
(define-constant ERR-ESCROW-INSUFFICIENT-BALANCE (err u203))
(define-constant ERR-ESCROW-UNAUTHORIZED (err u204))

;; Access control errors (300-399)
(define-constant ERR-UNAUTHORIZED (err u300))
(define-constant ERR-NOT-OWNER (err u301))
(define-constant ERR-NOT-ADMIN (err u302))
(define-constant ERR-CONTRACT-PAUSED (err u303))

;; Validation errors (400-499)
(define-constant ERR-INVALID-INPUT (err u400))
(define-constant ERR-INVALID-ADDRESS (err u401))
(define-constant ERR-INVALID-AMOUNT (err u402))
(define-constant ERR-AMOUNT-ZERO (err u403))
(define-constant ERR-AMOUNT-TOO-LARGE (err u404))

;; State errors (500-599)
(define-constant ERR-CONTRACT-ALREADY-INITIALIZED (err u500))
(define-constant ERR-CONTRACT-NOT-INITIALIZED (err u501))
