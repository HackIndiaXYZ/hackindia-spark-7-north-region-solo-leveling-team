export const CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000000";

export const CONTRACT_ABI = [
  "function applyForLoan(uint256 amount, uint256 creditScore, string memory purpose, uint256 duration) external",
  "function fundLoan(address borrower, uint256 loanId) external payable",
  "function repayLoan(uint256 loanId) external payable",
  "function markAsDefaulted(address borrower, uint256 loanId) external",
  "function getLoansByBorrower(address borrower) external view returns (tuple(uint256 id, address borrower, uint256 amount, uint256 creditScore, uint256 interestRateBps, uint256 duration, string purpose, uint8 status, uint256 createdAt, uint256 repayBy, bool repaid)[])",
  "function getAllPendingLoans() external view returns (tuple(uint256 id, address borrower, uint256 amount, uint256 creditScore, uint256 interestRateBps, uint256 duration, string purpose, uint8 status, uint256 createdAt, uint256 repayBy, bool repaid)[])",
  "function getDefaultedLoans() external view returns (tuple(uint256 id, address borrower, uint256 amount, uint256 creditScore, uint256 interestRateBps, uint256 duration, string purpose, uint8 status, uint256 createdAt, uint256 repayBy, bool repaid)[])",
  "function getProtocolStats() external view returns (uint256, uint256)",
  "function GRACE_PERIOD_DAYS() external view returns (uint256)",
  "event LoanApplied(uint256 indexed loanId, address indexed borrower, uint256 amount, uint256 creditScore)",
  "event LoanFunded(uint256 indexed loanId, address indexed lender, address indexed borrower, uint256 amount)",
  "event LoanRepaid(uint256 indexed loanId, address indexed borrower, uint256 amount)",
  "event LoanDefaulted(uint256 indexed loanId, address indexed borrower, uint256 amount)"
];
