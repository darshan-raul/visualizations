import type { LinuxPillar } from '../linux-types';
import { man } from '../linux-types';

export const storagePillar: LinuxPillar = {
  id: 'storage',
  name: 'Filesystem & Storage',
  short: 'Storage',
  promise: 'Let\'s demystify storage! We\'ll trace a pathname through mounts and filesystems to the actual blocks behind it.',
  hints: 'paths · mounts · blocks · inodes · links · fstab',
  bridge: 'Container volumes, PersistentVolumeClaims in K8s, and EBS attachments all eventually land in these same kernel mechanisms.',
  groups: [
    { label: 'Path to bytes', viewIds: ['path', 'mount', 'file-types'] },
    { label: 'Capacity', viewIds: ['space', 'open-file', 'partitioning', 'volume'] },
  ],
  views: [
    {
      id: 'path',
      label: 'Path lookup',
      title: 'Directories are just maps from names to numbers.',
      question: 'How does the kernel find a file from its path?',
      kind: 'path',
      actors: [
        { label: 'Pathname', detail: '/srv/app/config' },
        { label: 'Dir Entries', detail: 'Names to Inodes' },
        { label: 'Inode', detail: 'Metadata & block pointers' },
        { label: 'Open FD', detail: 'File descriptor table' }
      ],
      explanation: 'When you open a file, the kernel breaks the path into components. It reads the root directory\'s data to find the inode for \\"srv\\", reads \\"srv\\" to find \\"app\\", and so on. The directory entry simply maps the name to an inode number. The inode holds the metadata (permissions, size) and pointers to the actual data blocks on disk.',
      takeaway: 'Names live in directories; metadata lives in inodes.',
      command: 'stat /srv/app/config',
      output: '  File: /srv/app/config\n  Size: 4096      Blocks: 8          IO Block: 4096   regular file\nDevice: 259,3   Inode: 262145      Links: 1',
      probe: 'ls -i /srv/app',
      probeOutput: '262145 config\n262146 logs',
      caveat: 'This lookup process is heavily cached in the kernel\'s Directory Entry Cache (dcache) for performance.',
      source: `${man}man7/inode.7.html`
    },
    {
      id: 'mount',
      label: 'Mount chain',
      title: 'Stitching filesystems together.',
      question: 'How do different disks show up in one filesystem tree?',
      kind: 'layers',
      actors: [
        { label: 'Mount point', detail: '/mnt/data' },
        { label: 'Filesystem', detail: 'ext4' },
        { label: 'Partition', detail: '/dev/vdc1' },
        { label: 'Block device', detail: '/dev/vdc' }
      ],
      explanation: 'Linux exposes everything under a single unified root directory (/). Mounts attach separate filesystems (like a USB drive or a cloud volume) to specific directories in that tree. When a path crosses a mount point, the kernel smoothly hands off the lookup to the driver for that specific filesystem.',
      takeaway: 'findmnt is your best friend for seeing how the tree is assembled.',
      command: 'findmnt -n /mnt/data',
      output: '/mnt/data /dev/vdc1 ext4 rw,relatime',
      probe: 'lsblk -f /dev/vdc',
      probeOutput: 'NAME   FSTYPE FSVER LABEL UUID                                 FSAVAIL FSUSE% MOUNTPOINTS\nvdc\n└─vdc1 ext4   1.0         1234abcd-12ab-34cd-56ef-1234567890ab   45G      5% /mnt/data',
      caveat: 'Bind mounts and overlayfs can make the mount hierarchy very complex in containerized environments.',
      source: `${man}man8/mount.8.html`
    },
    {
      id: 'file-types',
      label: 'File types & links',
      title: 'Not everything in the filesystem is a "file".',
      question: 'What\'s the difference between regular files, directories, and links?',
      kind: 'comparison',
      items: [
        { label: 'Regular file', detail: 'Contains data bytes.', command: 'file /usr/bin/bash', output: '/usr/bin/bash: ELF 64-bit...', highlight: 'neutral' },
        { label: 'Directory', detail: 'A table mapping names to inodes.', command: 'ls -ld /etc', output: 'drwxr-xr-x 82 root root...', highlight: 'neutral' },
        { label: 'Symbolic link', detail: 'A pointer storing another path.', command: 'ls -l /bin/sh', output: 'lrwxrwxrwx 1 root root 4... sh -> dash', highlight: 'neutral' },
        { label: 'Hard link', detail: 'Multiple names for the exact same inode.', command: 'stat /usr/bin/test', output: 'Links: 2', highlight: 'neutral' },
        { label: 'Block/char device', detail: 'Interface to a hardware or virtual driver.', command: 'ls -l /dev/sda /dev/tty', output: 'brw-rw---- 1 root disk... /dev/sda\ncrw-rw-rw- 1 root tty... /dev/tty', highlight: 'neutral' }
      ],
      explanation: 'The first character of ls -l output tells you the file type. A regular file (-) is data. A directory (d) is a list. A symlink (l) is a shortcut that can break if the target is moved. A hard link is another name for the exact same data — they share an inode, so deleting one doesn\'t delete the data until all names are gone.',
      takeaway: 'Check the first character of ls -l to know what you are really dealing with.',
      command: 'ls -la /tmp | head -n 4',
      output: 'drwxrwxrwt 15 root root 4096 Sep 15 17:00 .\ndrwxr-xr-x 19 root root 4096 Sep 15 12:00 ..\nsrwxrwxrwx  1 mysql mysql  0 Sep 15 12:05 mysql.sock\n-rw-------  1 root root  123 Sep 15 12:10 test.log',
      probe: 'file /dev/null',
      probeOutput: '/dev/null: character special (1/3)',
      caveat: 'Unix domain sockets (s) and FIFOs (p) are also file types, used for inter-process communication.',
      source: `${man}man1/ls.1.html`
    },
    {
      id: 'space',
      label: 'Space vs inodes',
      title: 'Two ways to run out of disk space.',
      question: 'Why does my disk say it\'s full when df -h shows 50% free?',
      kind: 'split',
      actors: [
        { label: 'Data Blocks', detail: 'Store file contents (50% free)' },
        { label: 'Inodes', detail: 'Inode exhaustion (0% free!)' }
      ],
      failure: {
        label: 'Free inode slots',
        result: 'Cleanup frees metadata slots; writes succeed again',
        output: 'find /var/spool/clientmqueue -type f -delete && touch test.txt\nFile created successfully.',
        blocked: 1,
        afterActors: [
          { label: 'Data Blocks', detail: 'Store file contents (50% free)' },
          { label: 'Inodes', detail: 'Inodes available (25% used)' }
        ]
      },
      explanation: 'When a filesystem is created, it allocates a fixed number of inodes (metadata slots) and a pool of data blocks. Every file consumes exactly one inode, plus blocks for its size. If an app writes millions of tiny 1-byte files, you will consume all the inodes long before you run out of data blocks. The OS will report "No space left on device" even if df -h shows plenty of room.',
      takeaway: 'Always check df -i when you see unexpected "No space left" errors.',
      command: 'df -h /var',
      output: 'Filesystem      Size  Used Avail Use% Mounted on\n/dev/sda2        20G   10G   10G  50% /var',
      probe: 'df -i /var',
      probeOutput: 'Filesystem     Inodes IUsed IFree IUse% Mounted on\n/dev/sda2        1.3M  1.3M     0  100% /var',
      caveat: 'Some modern filesystems like XFS or Btrfs allocate inodes dynamically and don\'t suffer from this as rigidly as ext4.',
      source: `${man}man1/df.1.html`
    },
    {
      id: 'open-file',
      label: 'Deleted but open',
      title: 'A file isn\'t gone until everyone lets go.',
      question: 'I deleted a huge log file, but df still shows the disk as full. Why?',
      kind: 'tree',
      actors: [
        { label: 'Open File', detail: 'nginx still writing' },
        { label: 'Directory Entry', detail: 'Removed via rm' },
        { label: 'Inode & Blocks', detail: 'Kept alive by open FD' }
      ],
      explanation: 'Linux files have reference counts. A file\'s data is only freed when its link count drops to zero AND no processes have it open. If you run rm access.log while nginx is still running, you only remove the directory entry. The inode and blocks remain on disk, consuming space, because nginx still has the file open.',
      takeaway: 'Don\'t rm active log files; truncate them instead: > access.log.',
      command: 'lsof +L1',
      output: 'COMMAND   PID USER   FD   TYPE DEVICE SIZE/OFF NLINK      NODE NAME\nnginx     421 nginx   3w   REG  259,3      10G     0    262145 /var/log/nginx/access.log (deleted)',
      probe: '> /var/log/nginx/access.log',
      probeOutput: '# Wait, if it\'s deleted, truncating the path won\'t help. You must reload the service: systemctl reload nginx',
      caveat: 'To properly rotate logs, use logrotate which handles moving and signaling services to reopen their files.',
      source: `${man}man8/lsof.8.html`
    },
    {
      id: 'partitioning',
      label: 'Disk setup & fstab',
      title: 'From raw disk to mounted filesystem.',
      question: 'How do I actually set up a new disk?',
      kind: 'recipe',
      recipeSteps: [
        { step: 'Identify the new disk', command: 'lsblk', output: 'vdc  50G  disk', note: 'Look for the disk with no partitions or mount points.' },
        { step: 'Create a partition', command: 'sudo fdisk /dev/vdc', output: 'Command: n → p → 1 → Enter → Enter → w', note: 'Interactive tool. Accept defaults for whole disk.' },
        { step: 'Create a filesystem', command: 'sudo mkfs.ext4 /dev/vdc1', output: 'Creating filesystem with 13107200 4k blocks', note: 'This wipes the partition. Use xfs for huge volumes.' },
        { step: 'Mount it', command: 'sudo mkdir -p /mnt/data && sudo mount /dev/vdc1 /mnt/data', output: '# No output on success', note: 'Temporary mount to verify it works.' },
        { step: 'Make it permanent', command: 'echo "UUID=1234abcd-12ab... /mnt/data ext4 defaults 0 2" | sudo tee -a /etc/fstab', output: 'UUID=... /mnt/data ext4 defaults 0 2', note: 'Use UUIDs, not /dev/vdc1, as device names can change.' },
        { step: 'Test fstab', command: 'sudo mount -a', output: '# No output if fstab is correct', note: 'ALWAYS run this after editing fstab. A broken fstab stops the system from booting!' }
      ],
      explanation: 'Setting up a new disk involves layers: identifying the hardware device, slicing it into partitions, formatting those slices with a filesystem, and mounting them into the directory tree. The /etc/fstab file ensures the mount happens automatically on boot.',
      takeaway: 'Five layers: device → partition → filesystem → mount → fstab.',
      command: 'lsblk -f',
      output: 'vdc\n└─vdc1 ext4 /mnt/data',
      probe: 'findmnt /mnt/data',
      probeOutput: 'TARGET    SOURCE    FSTYPE OPTIONS\n/mnt/data /dev/vdc1 ext4   rw,relatime',
      caveat: 'Using LVM (Logical Volume Manager) adds an abstraction layer between partitions and filesystems, allowing flexible resizing.',
      source: `${man}man8/fdisk.8.html`
    },
    {
      id: 'volume',
      label: 'Cloud disk growth',
      title: 'Expanding storage without downtime.',
      question: 'I increased the disk size in AWS/GCP, but my OS doesn\'t see it. Why?',
      kind: 'recipe',
      recipeSteps: [
        { step: 'Resize in cloud console', command: '# Click "Modify Volume" in AWS/GCP', output: '', note: 'The hypervisor gives the VM a larger block device, but the OS doesn\'t know yet.' },
        { step: 'Verify OS sees larger device', command: 'lsblk', output: 'vdc  100G  disk\n└─vdc1 50G part', note: 'The disk is 100G, but the partition is still 50G.' },
        { step: 'Grow the partition', command: 'sudo growpart /dev/vdc 1', output: 'CHANGED: partition=1 start=2048 old: size=104857600 end=104859648 new: size=209713119 end=209715167', note: 'This rewrites the partition table so vdc1 spans the new space.' },
        { step: 'Resize the filesystem', command: 'sudo resize2fs /dev/vdc1', output: 'Filesystem at /dev/vdc1 is mounted on /mnt/data; on-line resizing required', note: 'Tells the ext4 filesystem to expand into the newly enlarged partition. (Use xfs_growfs for XFS).' },
        { step: 'Verify new space', command: 'df -h /mnt/data', output: '/dev/vdc1  100G  45G  55G  45% /mnt/data', note: 'Now the space is finally usable.' }
      ],
      explanation: 'Increasing volume size in a cloud provider only gives you a larger physical (or virtual) disk. You must manually inform the OS layers to use the space: first expand the partition table to encompass the new blocks, then expand the filesystem structures to manage them.',
      takeaway: 'Resizing storage is manual: modify cloud → grow partition → resize filesystem.',
      command: 'lsblk',
      output: 'vdc    252:32   0  100G  0 disk\n└─vdc1 252:33   0  100G  0 part /mnt/data',
      probe: 'df -h /mnt/data',
      probeOutput: 'Filesystem      Size  Used Avail Use% Mounted on\n/dev/vdc1        99G   45G   50G  48% /mnt/data',
      caveat: 'NVMe volumes in AWS sometimes require rescan commands (`echo 1 > /sys/class/block/nvme0n1/device/rescan`) before lsblk sees the new size.',
      source: `${man}man8/resize2fs.8.html`
    }
  ]
};
