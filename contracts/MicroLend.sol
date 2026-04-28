// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title MicroLend
 * @dev AI-Powered DeFi Micro-Lending Platform
 */

interface IReputationSBT {
    enum BadgeType { NONE, GOOD_BORROWER, DEFAULTER }
    function mint(address to, BadgeType badge) external;
}

contract MicroLend {
    enum LoanStatus { PENDING, FUNDED, REPAID, DEFAULTED }

    struct LoanRequest {
        uint id;
        address borrower;
        uint amount;
        uint creditScore;
        uint interestRateBps; // In basis points (100 = 1%)
        uint duration;
        string purpose;
        LoanStatus status;
        uint createdAt;
        uint repayBy;
        bool repaid;
        string collateralAsset;
        uint collateralValue;
        bool extensionRequested;
        uint8 extensionsUsed;
        uint8 maxExtensions;
        uint gracePeriodEnd;
    }

    mapping(address => LoanRequest[]) public borrowerLoans;
    mapping(uint => address) public loanIdToLender;
    mapping(uint => address) public loanIdToBorrower; // Added to enable getAllPendingLoans
    uint public totalLoansIssued;
    uint public totalValueLocked;
    uint public loanCounter;
    address public owner;
    uint public PROTOCOL_FEE = 5; // 0.5% in basis points
    IReputationSBT public reputationContract;

    event LoanApplied(uint indexed loanId, address indexed borrower, uint amount, uint creditScore);
    event LoanFunded(uint indexed loanId, address indexed lender, address indexed borrower, uint amount);
    event LoanRepaid(uint indexed loanId, address indexed borrower, uint amount);
    event LoanDefaulted(uint indexed loanId, address indexed borrower, uint amount);

    uint public constant GRACE_PERIOD_DAYS = 7;

    bool private locked;

    modifier nonReentrant() {
        require(!locked, "ReentrancyGuard: reentrant call");
        locked = true;
        _;
        locked = false;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }

    modifier validLoanId(uint _loanId) {
        require(_loanId > 0 && _loanId <= loanCounter, "Invalid loan ID");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function setReputationContract(address _addr) external onlyOwner {
        reputationContract = IReputationSBT(_addr);
    }

    function getDynamicRateBps(uint duration) public pure returns (uint) {
        if (duration <= 7)   return 500;
        if (duration <= 14)  return 550;
        if (duration <= 30)  return 600;
        if (duration <= 60)  return 700;
        if (duration <= 90)  return 800;
        if (duration <= 120) return 900;
        if (duration <= 180) return 1050;
        if (duration <= 270) return 1200;
        return 1400;
    }

    /**
     * @dev Apply for a new loan
     * @param amount Loan amount in wei
     * @param creditScore Output from AI oracle
     * @param purpose Purpose of the loan
     * @param duration Duration in days (30, 60, or 90)
     * @param collateralAsset Type of real world asset (e.g. "Vehicle")
     * @param collateralValue Estimated value of the asset in INR
     * @param extensionRequested Whether to request future extension capability
     */
    function applyForLoan(uint amount, uint creditScore, string memory purpose, uint duration, string memory collateralAsset, uint collateralValue, bool extensionRequested) external {
        require(creditScore >= 600, "Credit score too low");
        require(amount >= 0.001 ether && amount <= 1 ether, "Amount out of range");
        require(duration > 0 && duration <= 365, "Invalid duration");

        loanCounter++;
        uint newLoanId = loanCounter;

        LoanRequest memory newLoan = LoanRequest({
            id: newLoanId,
            borrower: msg.sender,
            amount: amount,
            creditScore: creditScore,
            interestRateBps: getDynamicRateBps(duration),
            duration: duration,
            purpose: purpose,
            status: LoanStatus.PENDING,
            createdAt: block.timestamp,
            repayBy: 0, // Set when funded
            repaid: false,
            collateralAsset: collateralAsset,
            collateralValue: collateralValue,
            extensionRequested: extensionRequested,
            extensionsUsed: 0,
            maxExtensions: 1,
            gracePeriodEnd: 0
        });

        borrowerLoans[msg.sender].push(newLoan);
        loanIdToBorrower[newLoanId] = msg.sender;
        totalLoansIssued++;

        emit LoanApplied(newLoanId, msg.sender, amount, creditScore);
    }

    /**
     * @dev Fund a pending loan
     * @param borrower Address of the borrower
     * @param loanId ID of the loan inside borrower array
     */
    function fundLoan(address borrower, uint loanId) external payable nonReentrant validLoanId(loanId) {
        LoanRequest[] storage loans = borrowerLoans[borrower];
        
        bool found = false;
        uint loanIndex;
        for (uint i = 0; i < loans.length; i++) {
            if (loans[i].id == loanId) {
                found = true;
                loanIndex = i;
                break;
            }
        }
        require(found, "Loan not found for borrower");
        
        LoanRequest storage loan = loans[loanIndex];
        require(loan.status == LoanStatus.PENDING, "Loan not pending");
        require(msg.value == loan.amount, "Incorrect ETH amount sent");

        loanIdToLender[loanId] = msg.sender;
        loan.status = LoanStatus.FUNDED;
        loan.repayBy = block.timestamp + (loan.duration * 1 days);
        loan.gracePeriodEnd = loan.repayBy + (GRACE_PERIOD_DAYS * 1 days);
        
        totalValueLocked += loan.amount;

        (bool success, ) = borrower.call{value: loan.amount}("");
        require(success, "ETH transfer failed");

        emit LoanFunded(loanId, msg.sender, borrower, loan.amount);
    }

    /**
     * @dev Repay a loan
     * @param loanId ID of the loan to repay
     */
    function repayLoan(uint loanId) external payable nonReentrant validLoanId(loanId) {
        LoanRequest[] storage loans = borrowerLoans[msg.sender];
        bool found = false;
        uint loanIndex;
        for (uint i = 0; i < loans.length; i++) {
            if (loans[i].id == loanId) {
                found = true;
                loanIndex = i;
                break;
            }
        }
        require(found, "Loan not found");
        
        LoanRequest storage loan = loans[loanIndex];
        require(loan.status == LoanStatus.FUNDED, "Loan is not funded");
        require(!loan.repaid, "Loan already repaid");

        // Repayment = principal + dynamic interest
        uint interest = (loan.amount * loan.interestRateBps) / 10000;
        uint repayment = loan.amount + interest;
        require(msg.value >= repayment, "Insufficient repayment amount");

        address lender = loanIdToLender[loanId];
        
        // Protocol fee 0.5% of repayment
        uint fee = (repayment * PROTOCOL_FEE) / 1000;
        uint lenderShare = repayment - fee;

        loan.status = LoanStatus.REPAID;
        loan.repaid = true;
        totalValueLocked -= loan.amount;

        if (address(reputationContract) != address(0)) {
            reputationContract.mint(msg.sender, IReputationSBT.BadgeType.GOOD_BORROWER);
        }

        if (lender != address(0)) {
            (bool successLender, ) = lender.call{value: lenderShare}("");
            require(successLender, "Transfer to lender failed");
        }

        (bool successOwner, ) = owner.call{value: fee}("");
        require(successOwner, "Transfer to owner failed");

        // Refund any excess
        if (msg.value > repayment) {
            (bool successRefund, ) = msg.sender.call{value: msg.value - repayment}("");
            require(successRefund, "Refund failed");
        }

        emit LoanRepaid(loanId, msg.sender, loan.amount);
    }

    /**
     * @dev Get all loans for a borrower
     */
    function getLoansByBorrower(address borrower) external view returns (LoanRequest[] memory) {
        return borrowerLoans[borrower];
    }

    /**
     * @dev Get all pending loans globally
     */
    function getAllPendingLoans() external view returns (LoanRequest[] memory) {
        uint pendingCount = 0;
        
        for (uint i = 1; i <= loanCounter; i++) {
            address borrower = loanIdToBorrower[i];
            LoanRequest[] memory loans = borrowerLoans[borrower];
            for (uint j = 0; j < loans.length; j++) {
                if (loans[j].id == i && loans[j].status == LoanStatus.PENDING) {
                    pendingCount++;
                    break;
                }
            }
        }
        
        LoanRequest[] memory result = new LoanRequest[](pendingCount);
        uint currentIndex = 0;
        
        for (uint i = 1; i <= loanCounter; i++) {
            address borrower = loanIdToBorrower[i];
            LoanRequest[] memory loans = borrowerLoans[borrower];
            for (uint j = 0; j < loans.length; j++) {
                if (loans[j].id == i && loans[j].status == LoanStatus.PENDING) {
                    result[currentIndex] = loans[j];
                    currentIndex++;
                    break;
                }
            }
        }
        
        return result;
    }

    /**
     * @dev Get protocol statistics
     */
    function getProtocolStats() external view returns (uint, uint) {
        return (totalLoansIssued, totalValueLocked);
    }

    /**
     * @dev Mark a loan as defaulted after repayBy + grace period has passed
     * @param borrower Address of the borrower
     * @param loanId ID of the loan
     */
    function markAsDefaulted(address borrower, uint loanId) external validLoanId(loanId) {
        LoanRequest[] storage loans = borrowerLoans[borrower];
        bool found = false;
        uint loanIndex;
        for (uint i = 0; i < loans.length; i++) {
            if (loans[i].id == loanId) {
                found = true;
                loanIndex = i;
                break;
            }
        }
        require(found, "Loan not found");

        LoanRequest storage loan = loans[loanIndex];
        require(loan.status == LoanStatus.FUNDED, "Loan is not in funded state");
        require(!loan.repaid, "Loan already repaid");
        require(loan.repayBy > 0, "Loan has no repayment deadline");
        require(
            block.timestamp > loan.gracePeriodEnd,
            "Grace period has not elapsed"
        );

        loan.status = LoanStatus.DEFAULTED;
        totalValueLocked -= loan.amount;

        if (address(reputationContract) != address(0)) {
            reputationContract.mint(borrower, IReputationSBT.BadgeType.DEFAULTER);
        }

        emit LoanDefaulted(loanId, borrower, loan.amount);
    }

    /**
     * @dev Get all defaulted loans globally
     */
    function getDefaultedLoans() external view returns (LoanRequest[] memory) {
        uint count = 0;
        for (uint i = 1; i <= loanCounter; i++) {
            address borrower = loanIdToBorrower[i];
            LoanRequest[] memory loans = borrowerLoans[borrower];
            for (uint j = 0; j < loans.length; j++) {
                if (loans[j].id == i && loans[j].status == LoanStatus.DEFAULTED) {
                    count++;
                    break;
                }
            }
        }
        LoanRequest[] memory result = new LoanRequest[](count);
        uint idx = 0;
        for (uint i = 1; i <= loanCounter; i++) {
            address borrower = loanIdToBorrower[i];
            LoanRequest[] memory loans = borrowerLoans[borrower];
            for (uint j = 0; j < loans.length; j++) {
                if (loans[j].id == i && loans[j].status == LoanStatus.DEFAULTED) {
                    result[idx] = loans[j];
                    idx++;
                    break;
                }
            }
        }
        return result;
    }

    /**
     * @dev Extend repayment date by 30 days
     * @param loanId ID of the loan to extend
     */
    function extendRepaymentDate(uint loanId) external nonReentrant validLoanId(loanId) {
        LoanRequest[] storage loans = borrowerLoans[msg.sender];
        bool found = false;
        uint loanIndex;
        for (uint i = 0; i < loans.length; i++) {
            if (loans[i].id == loanId) {
                found = true;
                loanIndex = i;
                break;
            }
        }
        require(found, "Loan not found");
        
        LoanRequest storage loan = loans[loanIndex];
        require(loan.status == LoanStatus.FUNDED, "Loan is not funded");
        require(!loan.repaid, "Loan already repaid");
        require(loan.extensionRequested, "Extension not requested during application");
        require(loan.extensionsUsed < loan.maxExtensions, "Max extensions reached");

        loan.repayBy += 30 days;
        loan.interestRateBps += 200; // Add 2% penalty
        loan.extensionsUsed += 1;
    }
}

