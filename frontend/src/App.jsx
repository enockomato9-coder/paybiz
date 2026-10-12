import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Banknote,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Code2,
  Download,
  Eye,
  FileBarChart,
  LayoutDashboard,
  LoaderCircle,
  LockKeyhole,
  LogOut,
  Menu,
  Search,
  Settings,
  ShieldCheck,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { apiRequest, downloadTransactions, ensureCsrfToken } from "./api";
import payBizLogo from "./assets/PayBizlogo.png";
import "./App.css";

const navigation = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Transactions", icon: ArrowLeftRight },
  { label: "Wallets", icon: Wallet },
  { label: "Businesses", icon: Building2 },
  { label: "Agents", icon: Users },
  { label: "Reports", icon: FileBarChart },
  { label: "Developer API", icon: Code2 },
];

const moneyFormatter = new Intl.NumberFormat("en-KE", {
  style: "currency",
  currency: "KES",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat("en-KE", {
  dateStyle: "medium",
  timeStyle: "short",
});

function money(amount, currency = "KES") {
  const value = Number(amount);
  if (!Number.isFinite(value)) return "—";
  if (currency !== "KES") {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }
  return moneyFormatter.format(value);
}

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : dateFormatter.format(date);
}

function initials(name = "") {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function useApiData(path) {
  const [state, setState] = useState({
    key: "",
    data: null,
    loading: true,
    error: "",
  });
  const [refreshIndex, setRefreshIndex] = useState(0);
  const requestKey = `${path}:${refreshIndex}`;

  useEffect(() => {
    const controller = new AbortController();

    apiRequest(path, { signal: controller.signal })
      .then((data) =>
        setState({ key: requestKey, data, loading: false, error: "" }),
      )
      .catch((error) => {
        if (!controller.signal.aborted) {
          setState({
            key: requestKey,
            data: null,
            loading: false,
            error: error.message || "Could not load the requested information.",
          });
        }
      });

    return () => controller.abort();
  }, [path, requestKey]);

  const currentState =
    state.key === requestKey
      ? state
      : { data: null, loading: true, error: "" };
  return {
    ...currentState,
    refresh: () => setRefreshIndex((value) => value + 1),
  };
}

function Sidebar({ activePage, setActivePage, mobileOpen, closeMobile, pendingCount }) {
  return (
    <>
      {mobileOpen && (
        <button
          className="mobile-overlay"
          aria-label="Close navigation"
          onClick={closeMobile}
        />
      )}
      <aside className={`sidebar${mobileOpen ? " sidebar-open" : ""}`}>
        <a
          className="brand"
          href="#overview"
          onClick={(event) => {
            event.preventDefault();
            setActivePage("Overview");
            closeMobile();
          }}
          aria-label="PayBiz overview"
        >
          <span className="brand-mark">
            <img src={payBizLogo} alt="" />
          </span>
          <span className="brand-copy">
            <span className="brand-name">PayBiz</span>
            <span className="brand-caption">PAYMENTS PLATFORM</span>
          </span>
        </a>

        <div className="sidebar-label">WORKSPACE</div>
        <nav className="navigation" aria-label="Workspace">
          {navigation.map(({ label, icon: Icon }) => (
            <button
              key={label}
              className={`nav-item${activePage === label ? " nav-active" : ""}`}
              aria-current={activePage === label ? "page" : undefined}
              onClick={() => {
                setActivePage(label);
                closeMobile();
              }}
            >
              <Icon size={18} strokeWidth={1.8} />
              <span>{label}</span>
              {label === "Transactions" && pendingCount !== null && pendingCount > 0 && (
                <span className="nav-count">{pendingCount}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="security-card">
            <span className="security-icon">
              <ShieldCheck size={18} />
            </span>
            <span>
              <strong>Secure workspace</strong>
              <span className="security-caption">Protected by your account</span>
            </span>
          </div>
          <button
            className={`nav-item${activePage === "Settings" ? " nav-active" : ""}`}
            aria-current={activePage === "Settings" ? "page" : undefined}
            onClick={() => {
              setActivePage("Settings");
              closeMobile();
            }}
          >
            <Settings size={18} strokeWidth={1.8} />
            <span>Settings</span>
          </button>
          <div className="sidebar-footer">
            <span className="footer-dot" />
            <span>PayBiz workspace</span>
            <span className="version">KES</span>
          </div>
        </div>
      </aside>
    </>
  );
}

function Header({ activePage, user, setMobileOpen, onSignOut, signingOut }) {
  const [profileOpen, setProfileOpen] = useState(false);
  const displayName = user.name || user.username;
  const role = user.isStaff
    ? "Platform administrator"
    : user.accountType
      ? `${user.accountType[0].toUpperCase()}${user.accountType.slice(1)} account`
      : "PayBiz account";

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          className="icon-button mobile-menu"
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation"
        >
          <Menu size={20} />
        </button>
        <div className="breadcrumbs" aria-label="Breadcrumb">
          <span>Workspace</span>
          <span className="breadcrumb-divider">/</span>
          <strong>{activePage}</strong>
        </div>
      </div>

      <div className="topbar-actions">
        <span className="secure-indicator">
          <span className="secure-dot" />
          Secure session
        </span>
        <div className="profile-menu">
          <button
            className="profile-button"
            aria-expanded={profileOpen}
            onClick={() => setProfileOpen((open) => !open)}
          >
            <span className="avatar avatar-admin">{initials(displayName)}</span>
            <span className="profile-info">
              <strong>{displayName}</strong>
              <span>{role}</span>
            </span>
            <ChevronDown size={16} />
          </button>
          {profileOpen && (
            <div className="profile-dropdown">
              {user.email && <span className="profile-email">{user.email}</span>}
              <button
                className="dropdown-action"
                disabled={signingOut}
                onClick={() => {
                  setProfileOpen(false);
                  onSignOut();
                }}
              >
                {signingOut ? (
                  <LoaderCircle className="spin" size={16} />
                ) : (
                  <LogOut size={16} />
                )}
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function PageHeading({ eyebrow, title, description, action }) {
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">
          <span className="eyebrow-mark" />
          {eyebrow}
        </div>
        <h1>{title}</h1>
        {description && <p className="page-subtitle">{description}</p>}
      </div>
      {action && <div className="heading-action">{action}</div>}
    </div>
  );
}

function StatCard({ title, value, description, icon: Icon, tone }) {
  return (
    <article className={`stat-card stat-${tone}`}>
      <div className="stat-top">
        <span className="stat-title">{title}</span>
        <span className="stat-icon">
          <Icon size={19} strokeWidth={1.8} />
        </span>
      </div>
      <strong className="stat-value">{value}</strong>
      <span className="stat-description">{description}</span>
    </article>
  );
}

function LoadingState({ label = "Loading account data" }) {
  return (
    <div className="loading-state" role="status">
      <LoaderCircle className="spin" size={20} />
      <span>{label}</span>
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="error-state" role="alert">
      <span className="error-symbol">!</span>
      <div>
        <strong>We couldn’t load this information</strong>
        <span>{message}</span>
      </div>
      <button className="button button-outline" onClick={onRetry}>
        Try again
      </button>
    </div>
  );
}

function EmptyState({ icon: Icon = Activity, title, description }) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <Icon size={22} />
      </span>
      <strong>{title}</strong>
      <span>{description}</span>
    </div>
  );
}

function ActivityChart({ data = [] }) {
  const points = useMemo(() => {
    const width = 600;
    const height = 174;
    const insetX = 10;
    const insetY = 16;
    const max = Math.max(
      1,
      ...data.map((item) => Number(item.volume) || 0),
    );
    return data.map((item, index) => {
      const x = insetX + (index * (width - 2 * insetX)) / Math.max(data.length - 1, 1);
      const y =
        height -
        insetY -
        ((Number(item.volume) || 0) / max) * (height - 2 * insetY);
      return { ...item, x, y };
    });
  }, [data]);
  const polyline = points.map((point) => `${point.x},${point.y}`).join(" ");
  const area = points.length
    ? `10,174 ${polyline} 590,174`
    : "";
  const hasActivity = data.some((item) => Number(item.volume) > 0);

  return (
    <section className="panel chart-card">
      <div className="panel-heading">
        <div>
          <h2>Completed payment volume</h2>
          <p>Recorded transactions over the last seven days</p>
        </div>
        <span className="period-label">Last 7 days</span>
      </div>
      {hasActivity ? (
        <>
          <div className="chart-total">
            {money(
              data.reduce((sum, item) => sum + Number(item.volume || 0), 0),
            )}
            <span>total completed</span>
          </div>
          <div className="chart-plot">
            <div className="chart-grid-lines" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
            </div>
            <svg
              className="activity-chart"
              viewBox="0 0 600 180"
              preserveAspectRatio="none"
              role="img"
              aria-label="Completed payment volume over the last seven days"
            >
              <defs>
                <linearGradient id="activity-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#16734b" stopOpacity=".18" />
                  <stop offset="100%" stopColor="#16734b" stopOpacity="0" />
                </linearGradient>
              </defs>
              <polygon points={area} fill="url(#activity-fill)" />
              <polyline
                points={polyline}
                fill="none"
                stroke="#16734b"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
              {points.map((point) => (
                <circle
                  key={point.date}
                  cx={point.x}
                  cy={point.y}
                  r="4"
                  fill="#fff"
                  stroke="#16734b"
                  strokeWidth="2.5"
                  vectorEffect="non-scaling-stroke"
                />
              ))}
            </svg>
          </div>
          <div className="chart-labels" aria-hidden="true">
            {points.map((point) => (
              <span key={point.date}>{point.label}</span>
            ))}
          </div>
        </>
      ) : (
        <EmptyState
          icon={Activity}
          title="No completed payments this week"
          description="When transactions are recorded, their daily totals will appear here."
        />
      )}
    </section>
  );
}

function TransactionTypePanel({ types = [] }) {
  const total = types.reduce((sum, item) => sum + item.count, 0);
  const colors = ["#16734b", "#d3a342", "#b34b40"];

  return (
    <section className="panel type-card">
      <div className="panel-heading">
        <div>
          <h2>Transaction activity</h2>
          <p>Breakdown from saved records</p>
        </div>
        <span className="panel-icon">
          <Activity size={18} />
        </span>
      </div>
      <div className="type-total">
        <span>Total transactions</span>
        <strong>{total.toLocaleString("en-KE")}</strong>
      </div>
      {types.length ? (
        <div className="type-list">
          {types.map((item, index) => (
            <div className="type-row" key={item.type}>
              <div className="type-name">
                <span
                  className="type-dot"
                  style={{ "--type-color": colors[index % colors.length] }}
                />
                <span>{item.label}</span>
              </div>
              <strong>{item.count.toLocaleString("en-KE")}</strong>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={ArrowLeftRight}
          title="No transactions recorded"
          description="New transaction types will be listed here."
        />
      )}
    </section>
  );
}

function TransactionRows({ records, onSelect }) {
  if (!records.length) {
    return (
      <tr>
        <td colSpan="6">
          <EmptyState
            icon={ArrowLeftRight}
            title="No transactions found"
            description="Try changing your search or filters."
          />
        </td>
      </tr>
    );
  }

  return records.map((transaction) => {
    const counterparty = transaction.sourceName || transaction.destinationName;
    const isIncoming = !transaction.sourceName;
    return (
      <tr key={transaction.id}>
        <td>
          <div className="transaction-cell">
            <span className={`transaction-symbol${isIncoming ? " incoming" : ""}`}>
              {isIncoming ? (
                <ArrowDownLeft size={15} />
              ) : (
                <ArrowUpRight size={15} />
              )}
            </span>
            <span className="transaction-copy">
              <strong>{transaction.code}</strong>
              <span>{transaction.typeLabel}</span>
            </span>
          </div>
        </td>
        <td>
          <div className="customer-cell">
            <span className="avatar">{initials(counterparty || "Account")}</span>
            <span>{counterparty || "Platform"}</span>
          </div>
        </td>
        <td className="date-cell">{formatDate(transaction.createdAt)}</td>
        <td className="amount-cell">{money(transaction.amount)}</td>
        <td>
          <span className={`status status-${transaction.status}`}>
            <span className="status-dot" />
            {transaction.statusLabel}
          </span>
        </td>
        <td>
          <button
            className="icon-button row-action"
            aria-label={`View transaction ${transaction.code}`}
            title={`View ${transaction.code}`}
            onClick={() => onSelect(transaction)}
          >
            <Eye size={17} />
          </button>
        </td>
      </tr>
    );
  });
}

function TransactionTable({ records, onSelect }) {
  return (
    <div className="table-wrapper">
      <table className="transactions-table">
        <thead>
          <tr>
            <th>Transaction</th>
            <th>Account</th>
            <th>Date &amp; time</th>
            <th>Amount</th>
            <th>Status</th>
            <th aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          <TransactionRows records={records} onSelect={onSelect} />
        </tbody>
      </table>
    </div>
  );
}

function TransactionModal({ transaction, onClose }) {
  useEffect(() => {
    function closeOnEscape(event) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  if (!transaction) return null;
  const fields = [
    ["Transaction code", transaction.code],
    ["Type", transaction.typeLabel],
    ["Status", transaction.statusLabel],
    ["Amount", money(transaction.amount)],
    ["Transaction fee", money(transaction.fee)],
    ["Source account", transaction.sourceName || transaction.sourceAccount || "—"],
    [
      "Destination account",
      transaction.destinationName || transaction.destinationAccount || "—",
    ],
    ["Reference", transaction.reference || "—"],
    ["Created", formatDate(transaction.createdAt)],
  ];

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="detail-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="transaction-detail-title"
      >
        <div className="modal-heading">
          <div>
            <span className="eyebrow">TRANSACTION RECORD</span>
            <h2 id="transaction-detail-title">{transaction.code}</h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close details">
            <X size={19} />
          </button>
        </div>
        <dl className="detail-list">
          {fields.map(([label, value]) => (
            <div className="detail-row" key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        {transaction.failureReason && (
          <div className="failure-reason">
            <strong>Failure reason</strong>
            <span>{transaction.failureReason}</span>
          </div>
        )}
        {transaction.description && (
          <div className="failure-reason description-box">
            <strong>Description</strong>
            <span>{transaction.description}</span>
          </div>
        )}
      </section>
    </div>
  );
}

function Overview({ user, onNavigate, onPendingCountChange }) {
  const { data, loading, error, refresh } = useApiData("/dashboard/");
  const [selected, setSelected] = useState(null);
  const summary = data?.summary;
  const records = data?.recentTransactions || [];

  useEffect(() => {
    if (summary) onPendingCountChange(summary.pendingCount);
  }, [onPendingCountChange, summary]);

  return (
    <>
      <PageHeading
        eyebrow="YOUR PAYMENT WORKSPACE"
        title={`Welcome back, ${user.name || user.username}`}
        description="A live view of the transactions and balances recorded in PayBiz."
        action={
          <button
            className="button button-primary"
            onClick={() => onNavigate("Transactions")}
          >
            <ArrowLeftRight size={16} />
            View transactions
          </button>
        }
      />

      {loading && !data ? (
        <LoadingState label="Loading your latest account data" />
      ) : error ? (
        <ErrorState message={error} onRetry={refresh} />
      ) : (
        <>
          <div className="data-notice">
            <span className="notice-icon">
              <ShieldCheck size={18} />
            </span>
            <span>
              <strong>Live account data</strong>
              Figures below are calculated from the records currently saved in
              your PayBiz database.
            </span>
            <button className="icon-button refresh-button" onClick={refresh} aria-label="Refresh dashboard">
              <Activity size={17} />
            </button>
          </div>

          <section className="stats-grid" aria-label="Account summary">
            <StatCard
              title="Completed payment volume"
              value={money(summary.completedVolume)}
              description="Sum of completed transactions"
              icon={CircleDollarSign}
              tone="green"
            />
            <StatCard
              title="Completed transactions"
              value={summary.completedCount.toLocaleString("en-KE")}
              description="Successfully recorded"
              icon={CheckCircle2}
              tone="gold"
            />
            <StatCard
              title="Pending transactions"
              value={summary.pendingCount.toLocaleString("en-KE")}
              description="Awaiting a final status"
              icon={Clock3}
              tone="terracotta"
            />
            <StatCard
              title="Available wallet balances"
              value={money(summary.walletBalance)}
              description={`${summary.walletCount.toLocaleString("en-KE")} active wallets`}
              icon={Wallet}
              tone="sage"
            />
          </section>

          <div className="analytics-grid">
            <ActivityChart data={data.dailyActivity} />
            <TransactionTypePanel types={data.transactionTypes} />
          </div>

          <section className="panel transactions-card">
            <div className="transactions-heading">
              <div>
                <h2>Recent transactions</h2>
                <p>Most recently recorded account activity</p>
              </div>
              <button
                className="button button-outline"
                onClick={() => onNavigate("Transactions")}
              >
                All transactions <ArrowUpRight size={15} />
              </button>
            </div>
            <TransactionTable records={records} onSelect={setSelected} />
          </section>
          <footer className="app-footer">
            <span>PayBiz · Secure payment management</span>
            <span>
              <span className="footer-dot" />
              Connected to your account
            </span>
          </footer>
        </>
      )}
      <TransactionModal
        transaction={selected}
        onClose={() => setSelected(null)}
      />
    </>
  );
}

function TransactionsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");

  const query = useMemo(() => {
    const params = new URLSearchParams({ page: String(page), page_size: "12" });
    if (search.trim()) params.set("search", search.trim());
    if (status) params.set("status", status);
    if (type) params.set("type", type);
    return params.toString();
  }, [page, search, status, type]);
  const { data, loading, error, refresh } = useApiData(`/transactions/?${query}`);
  const totalPages = data ? Math.max(1, Math.ceil(data.count / data.pageSize)) : 1;

  async function exportCsv() {
    setExporting(true);
    setExportError("");
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (status) params.set("status", status);
      if (type) params.set("type", type);
      await downloadTransactions(params.toString());
    } catch (exportFailure) {
      setExportError(exportFailure.message || "The export failed.");
    } finally {
      setExporting(false);
    }
  }

  function changeFilter(setter) {
    return (event) => {
      setter(event.target.value);
      setPage(1);
    };
  }

  return (
    <>
      <PageHeading
        eyebrow="PAYMENTS"
        title="Transactions"
        description="Search, review, and export saved payment records."
      />
      <section className="panel transactions-card">
        <div className="transactions-heading transactions-page-heading">
          <div>
            <h2>Transaction records</h2>
            <p>
              {data
                ? `${data.count.toLocaleString("en-KE")} matching records`
                : "Filter the transactions available to your account"}
            </p>
          </div>
          <button
            className="button button-outline"
            disabled={exporting || loading}
            onClick={exportCsv}
          >
            {exporting ? (
              <LoaderCircle className="spin" size={16} />
            ) : (
              <Download size={16} />
            )}
            Export CSV
          </button>
        </div>

        <div className="filter-row">
          <label className="table-search">
            <Search size={17} />
            <input
              type="search"
              placeholder="Search code, name or reference"
              value={search}
              onChange={changeFilter(setSearch)}
              aria-label="Search transactions"
            />
          </label>
          <label className="select-field">
            <span>Status</span>
            <select value={status} onChange={changeFilter(setStatus)}>
              <option value="">All statuses</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </label>
          <label className="select-field">
            <span>Type</span>
            <select value={type} onChange={changeFilter(setType)}>
              <option value="">All types</option>
              <option value="deposit">Deposit</option>
              <option value="send">Send</option>
              <option value="withdrawal">Withdrawal</option>
            </select>
          </label>
        </div>
        {exportError && (
          <div className="inline-error" role="alert">{exportError}</div>
        )}
        {loading && !data ? (
          <LoadingState label="Loading transaction records" />
        ) : error ? (
          <ErrorState message={error} onRetry={refresh} />
        ) : (
          <>
            {loading && <div className="table-refreshing" role="status">Updating results…</div>}
            <TransactionTable records={data.results} onSelect={setSelected} />
            <div className="table-footer">
              <span>
                Showing{" "}
                <strong>
                  {data.count ? (page - 1) * data.pageSize + 1 : 0}–{Math.min(page * data.pageSize, data.count)}
                </strong>{" "}
                of <strong>{data.count}</strong>
              </span>
              <div className="pagination">
                <button
                  className="icon-button"
                  aria-label="Previous page"
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  <ChevronLeft size={17} />
                </button>
                <span>
                  Page {page} of {totalPages}
                </span>
                <button
                  className="icon-button"
                  aria-label="Next page"
                  disabled={page >= totalPages || loading}
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                >
                  <ChevronRight size={17} />
                </button>
              </div>
            </div>
          </>
        )}
      </section>
      <TransactionModal transaction={selected} onClose={() => setSelected(null)} />
    </>
  );
}

function WalletsPage() {
  const { data, loading, error, refresh } = useApiData("/wallets/");
  return (
    <>
      <PageHeading
        eyebrow="BALANCES"
        title="Wallets"
        description="Review the actual PayBiz wallet accounts and current recorded balances."
      />
      <section className="panel directory-panel">
        <div className="transactions-heading">
          <div>
            <h2>Wallet accounts</h2>
            <p>{data ? `${data.count.toLocaleString("en-KE")} wallet accounts` : "Wallets linked to your account"}</p>
          </div>
          <span className="panel-icon"><Wallet size={19} /></span>
        </div>
        {loading && !data ? (
          <LoadingState label="Loading wallet accounts" />
        ) : error ? (
          <ErrorState message={error} onRetry={refresh} />
        ) : data.results.length ? (
          <div className="wallet-grid">
            {data.results.map((wallet) => (
              <article className="wallet-card" key={wallet.id}>
                <div className="wallet-card-heading">
                  <span className="wallet-card-icon"><Wallet size={19} /></span>
                  <span className={`status status-${wallet.active ? "completed" : "failed"}`}>
                    <span className="status-dot" />
                    {wallet.active ? "Active" : "Inactive"}
                  </span>
                </div>
                <span className="wallet-owner">{wallet.owner}</span>
                <span className="wallet-number">{wallet.accountNumber}</span>
                <strong className="wallet-balance">{money(wallet.balance, wallet.currency)}</strong>
                <span className="wallet-caption">{wallet.accountType} wallet · {wallet.currency}</span>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Wallet}
            title="No wallets available"
            description="Wallets linked to your account will appear here when they are created."
          />
        )}
      </section>
    </>
  );
}

function AccountsPage({ type }) {
  const { data, loading, error, refresh } = useApiData(`/accounts/?type=${type}`);
  const title = type === "business" ? "Businesses" : "Agents";
  const Icon = type === "business" ? Building2 : Users;

  return (
    <>
      <PageHeading
        eyebrow="ACCOUNTS"
        title={title}
        description={`View ${type === "business" ? "business" : "agent"} accounts currently saved in the PayBiz database.`}
      />
      <section className="panel directory-panel">
        <div className="transactions-heading">
          <div>
            <h2>{title} accounts</h2>
            <p>{data ? `${data.count.toLocaleString("en-KE")} accounts` : "Available account records"}</p>
          </div>
          <span className="panel-icon"><Icon size={19} /></span>
        </div>
        {loading && !data ? (
          <LoadingState label={`Loading ${title.toLowerCase()}`} />
        ) : error ? (
          <ErrorState message={error} onRetry={refresh} />
        ) : data.results.length ? (
          <div className="table-wrapper">
            <table className="directory-table">
              <thead>
                <tr>
                  <th>Account</th>
                  <th>Account number</th>
                  <th>Email</th>
                  <th>Wallet balance</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.results.map((account) => (
                  <tr key={account.id}>
                    <td>
                      <div className="customer-cell">
                        <span className="avatar">{initials(account.name)}</span>
                        <span><strong>{account.name}</strong><small>{account.accountTypeLabel}</small></span>
                      </div>
                    </td>
                    <td className="mono-cell">{account.accountNumber}</td>
                    <td>{account.email || "—"}</td>
                    <td className="amount-cell">
                      {account.balance === null ? "—" : money(account.balance, account.currency)}
                    </td>
                    <td>
                      <span className={`status status-${account.active ? "completed" : "failed"}`}>
                        <span className="status-dot" />
                        {account.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={Icon}
            title={`No ${title.toLowerCase()} registered`}
            description={`There are currently no ${type} accounts recorded in this workspace.`}
          />
        )}
      </section>
    </>
  );
}

function ReportsPage() {
  const { data, loading, error, refresh } = useApiData("/dashboard/");
  const summary = data?.summary;
  return (
    <>
      <PageHeading
        eyebrow="INSIGHTS"
        title="Reports"
        description="Reporting is calculated from recorded wallet and transaction data."
      />
      {loading && !data ? (
        <LoadingState label="Preparing account reports" />
      ) : error ? (
        <ErrorState message={error} onRetry={refresh} />
      ) : (
        <>
          <div className="stats-grid report-stats">
            <StatCard title="Completed volume" value={money(summary.completedVolume)} description="Recorded completed transactions" icon={CircleDollarSign} tone="green" />
            <StatCard title="Transaction fees" value={money(summary.completedFees)} description="Fees on completed transactions" icon={Banknote} tone="gold" />
            <StatCard title="Total transactions" value={summary.transactionCount.toLocaleString("en-KE")} description="All recorded statuses" icon={ArrowLeftRight} tone="sage" />
            <StatCard title="Failed transactions" value={summary.failedCount.toLocaleString("en-KE")} description="Recorded failed transactions" icon={X} tone="terracotta" />
          </div>
          <ActivityChart data={data.dailyActivity} />
          <div className="report-note">
            <FileBarChart size={18} />
            <span>Reports reflect the transactions visible to your signed-in account. Period comparisons are not shown because historical reporting periods are not configured.</span>
          </div>
        </>
      )}
    </>
  );
}

function UnconfiguredPage({ page, user }) {
  const isApi = page === "Developer API";
  const Icon = isApi ? Code2 : Settings;
  return (
    <>
      <PageHeading
        eyebrow={isApi ? "INTEGRATIONS" : "PREFERENCES"}
        title={page}
        description={
          isApi
            ? "API credential and webhook management for your PayBiz workspace."
            : "Manage the configuration options for your PayBiz workspace."
        }
      />
      <section className="panel setup-panel">
        <span className="setup-icon"><Icon size={23} /></span>
        <span className="eyebrow">BACKEND SETUP REQUIRED</span>
        <h2>{isApi ? "API key management isn’t configured" : "Workspace preferences aren’t configured"}</h2>
        <p>
          {isApi
            ? "This project does not yet have a backend model for API credentials or webhooks. No sample keys or connection status are displayed."
            : "This project does not yet have a backend model for saved workspace preferences. No temporary or unsaved settings are presented as active."}
        </p>
        {user.isStaff ? (
          <a className="button button-outline admin-link" href="/admin/" target="_blank" rel="noreferrer">
            <LockKeyhole size={16} />
            Open Django admin
            <ArrowUpRight size={15} />
          </a>
        ) : (
          <span className="admin-hint">Ask a workspace administrator about this configuration.</span>
        )}
      </section>
    </>
  );
}

function LoginPage({ onSignIn, submitting, error }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  function submit(event) {
    event.preventDefault();
    onSignIn(username, password);
  }

  return (
    <main className="auth-shell">
      <div className="auth-card">
        <a className="auth-brand" href="/" aria-label="PayBiz">
          <span className="brand-mark"><img src={payBizLogo} alt="" /></span>
          <span className="brand-name">PayBiz</span>
        </a>
        <div className="auth-emblem"><LockKeyhole size={22} /></div>
        <div className="eyebrow">SECURE WORKSPACE</div>
        <h1>Welcome back</h1>
        <p className="auth-subtitle">Sign in with your PayBiz account to continue.</p>
        {error && <div className="auth-error" role="alert">{error}</div>}
        <form className="auth-form" onSubmit={submit}>
          <label>
            <span>Username</span>
            <input
              autoComplete="username"
              autoFocus
              required
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Enter your username"
            />
          </label>
          <label>
            <span>Password</span>
            <span className="password-field">
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
              />
              <button
                type="button"
                className="password-toggle"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((visible) => !visible)}
              >
                <Eye size={17} />
              </button>
            </span>
          </label>
          <button className="button button-primary sign-in-button" disabled={submitting}>
            {submitting ? <LoaderCircle className="spin" size={17} /> : <LockKeyhole size={17} />}
            Sign in securely
          </button>
        </form>
        <div className="auth-security">
          <ShieldCheck size={15} />
          Your session is protected by Django authentication.
        </div>
      </div>
      <p className="auth-footer">PayBiz · Secure payments for Kenyan businesses</p>
    </main>
  );
}

function App() {
  const [activePage, setActivePage] = useState("Overview");
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [pendingCount, setPendingCount] = useState(null);

  useEffect(() => {
    let mounted = true;
    ensureCsrfToken()
      .then(() => apiRequest("/auth/me/"))
      .then((response) => {
        if (mounted) setUser(response.user);
      })
      .catch((error) => {
        if (mounted && error.status !== 401) setAuthError(error.message);
      })
      .finally(() => {
        if (mounted) setAuthLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    function handleUnauthorized() {
      if (user) {
        setUser(null);
        setPendingCount(null);
        setAuthError("Your secure session expired. Sign in again to continue.");
      }
    }

    window.addEventListener("paybiz:unauthorized", handleUnauthorized);
    return () =>
      window.removeEventListener("paybiz:unauthorized", handleUnauthorized);
  }, [user]);

  async function signIn(username, password) {
    setAuthSubmitting(true);
    setAuthError("");
    try {
      await ensureCsrfToken();
      const response = await apiRequest("/auth/login/", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      setUser(response.user);
      setPendingCount(null);
      setActivePage("Overview");
    } catch (error) {
      setAuthError(error.message || "Could not sign in.");
    } finally {
      setAuthSubmitting(false);
    }
  }

  async function signOut() {
    setSigningOut(true);
    setAuthError("");
    try {
      await apiRequest("/auth/logout/", { method: "POST" });
      setUser(null);
      setActivePage("Overview");
    } catch (error) {
      setAuthError(error.message || "Could not sign out.");
    } finally {
      setSigningOut(false);
    }
  }

  if (authLoading) {
    return (
      <main className="auth-shell">
        <LoadingState label="Connecting securely to PayBiz" />
      </main>
    );
  }

  if (!user) {
    return (
      <LoginPage
        onSignIn={signIn}
        submitting={authSubmitting}
        error={authError}
      />
    );
  }

  return (
    <div className="app-shell">
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        mobileOpen={mobileOpen}
        closeMobile={() => setMobileOpen(false)}
        pendingCount={pendingCount}
      />
      <div className="main-shell">
        <Header
          activePage={activePage}
          user={user}
          setMobileOpen={setMobileOpen}
          onSignOut={signOut}
          signingOut={signingOut}
        />
        {authError && (
          <div className="session-error" role="alert">
            {authError}
            <button onClick={() => setAuthError("")} aria-label="Dismiss message">
              <X size={15} />
            </button>
          </div>
        )}
        <main className="page-content" key={activePage}>
          {activePage === "Overview" && (
            <Overview
              user={user}
              onNavigate={setActivePage}
              onPendingCountChange={setPendingCount}
            />
          )}
          {activePage === "Transactions" && <TransactionsPage />}
          {activePage === "Wallets" && <WalletsPage />}
          {activePage === "Businesses" && <AccountsPage type="business" />}
          {activePage === "Agents" && <AccountsPage type="agent" />}
          {activePage === "Reports" && <ReportsPage />}
          {(activePage === "Developer API" || activePage === "Settings") && (
            <UnconfiguredPage page={activePage} user={user} />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
