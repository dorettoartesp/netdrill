import ps from './ps.json';
import top from './top.json';
import ss from './ss.json';
import ip from './ip.json';
import find from './find.json';
import journalctl from './journalctl.json';
import systemctl from './systemctl.json';
import chmod from './chmod.json';
import iptables from './iptables.json';
import tcpdump from './tcpdump.json';
import curl from './curl.json';
import vmstat from './vmstat.json';

export interface ManPage {
  command: string;
  title: string;
  sectionName: string;
  synopsis: string;
  description: string;
  options: string[];
  examples: string[];
}

export const BUNDLED_MAN_PAGES: Record<string, ManPage> = {
  ps: ps as ManPage,
  top: top as ManPage,
  ss: ss as ManPage,
  ip: ip as ManPage,
  find: find as ManPage,
  journalctl: journalctl as ManPage,
  systemctl: systemctl as ManPage,
  chmod: chmod as ManPage,
  iptables: iptables as ManPage,
  tcpdump: tcpdump as ManPage,
  curl: curl as ManPage,
  vmstat: vmstat as ManPage
};
