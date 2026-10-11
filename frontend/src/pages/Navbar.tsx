import { accounts } from "../constants/accounts";

type NavbarProps = {
  account: string;
  onAccountChange: (name: string) => void;
};

const Navbar = ({ account, onAccountChange }: NavbarProps) => {
  const choose = (name: string) => {
    onAccountChange(name);
    (document.activeElement as HTMLElement | null)?.blur(); // close dropdown
  };

  return (
    <div className="navbar bg-accent px-6 shadow-sm">
      <div className="flex-1">
        <a className=" text-xl">Mini Task Manager</a>
      </div>
      <div className="flex-none">
        <div className="dropdown dropdown-end">
          <div tabIndex={0} role="button" className="btn m-1">
            {account}
            <svg
              className="h-3 w-3 fill-current"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
            >
              <path d="M7 10l5 5 5-5z" />
            </svg>
          </div>
          <ul
            tabIndex={-1}
            className="dropdown-content menu bg-neutral text-white rounded-box z-1 w-52 p-2 shadow-sm"
          >
            {accounts.map((name) => (
              <li key={name}>
                <a onClick={() => choose(name)}>{name}</a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
