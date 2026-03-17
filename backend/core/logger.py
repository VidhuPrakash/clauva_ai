from colorama import Fore, Style, init

init(autoreset=True)


def info(msg: str):
    print(f"{Fore.CYAN}[INFO]{Style.RESET_ALL}    {msg}")


def success(msg: str):
    print(f"{Fore.GREEN}[SUCCESS]{Style.RESET_ALL} {msg}")


def warning(msg: str):
    print(f"{Fore.YELLOW}[WARNING]{Style.RESET_ALL} {msg}")


def error(msg: str):
    print(f"{Fore.RED}[ERROR]{Style.RESET_ALL}   {msg}")


def startup(msg: str):
    print(f"{Fore.MAGENTA}[STARTUP]{Style.RESET_ALL} {msg}")


def shutdown(msg: str):
    print(f"{Fore.YELLOW}[SHUTDOWN]{Style.RESET_ALL} {msg}")
