import type { LinuxPillar } from '../linux-types';
import { man } from '../linux-types';

export const storagePillar: LinuxPillar = {
  id: 'storage',
  name: 'Filesystem & Storage',
  short: 'Storage',
  promise: 'Demystify the Linux storage stack by tracing pathnames through the Virtual File System (VFS), directory entry caches, and inode tables down to physical block devices.',
  hints: 'paths · VFS · inodes · page cache · open-unlinked · fstab',
  bridge: 'Container volume mounts, Kubernetes PersistentVolumes (PV/PVC), and AWS EBS attachments all terminate in the exact same kernel VFS and block device structures.',
  groups: [
    { label: 'Path to bytes', viewIds: ['storage-concepts', 'path', 'mount', 'file-types'] },
    { label: 'Capacity', viewIds: ['space', 'open-file', 'partitioning', 'volume'] },
  ],
  views: [
    {
      id: 'storage-concepts',
      label: 'Core concepts',
      title: 'Before looking at the mechanics, what actually is a File or an Inode?',
      question: 'What are the foundational primitives of Linux Storage?',
      kind: 'concept-primer',
      concepts: [
        {
          term: 'File Descriptor (FD)',
          analogy: 'A Ticket to Read/Write',
          definition: 'When a process opens a file, the kernel hands it an integer (like 3 or 4) called a File Descriptor. The process uses this ticket to read or write data. When it closes the file, the ticket is destroyed.'
        },
        {
          term: 'VFS (Virtual File System)',
          analogy: 'A Universal Translator',
          definition: 'Linux supports many filesystems (ext4, XFS, NFS). The VFS is a unified abstraction layer. User programs just call read() or write(), and the VFS translates it for the specific underlying disk format.'
        },
        {
          term: 'Inode',
          analogy: 'A Passport with Metadata',
          definition: 'A file name is just a string in a directory. The ACTUAL file is an Inode—a data structure storing permissions, ownership, timestamps, and pointers to where the actual data blocks live on the hard drive.'
        },
        {
          term: 'Mount',
          analogy: 'Grafting a Branch on a Tree',
          definition: 'Unlike Windows (C:\\, D:\\), Linux has one single directory tree starting at "/". Disks and network drives are "mounted" (attached) as subdirectories (like /mnt/usb) onto that single tree.'
        }
      ],
      explanation: 'Storage in Linux is heavily abstracted to make everything look like a unified tree. A file path (like /var/log/syslog) is just a human-friendly pointer to an Inode. Processes never interact with Inodes or disk blocks directly; they interact with File Descriptors. The kernel handles all the complex translation in the background.',
      takeaway: 'Paths point to Inodes. Processes hold File Descriptors. The VFS connects them to the raw disk blocks.',
      command: 'stat -c "Inode: %i" /etc/passwd',
      output: 'Inode: 131075',
      probe: 'ls -l /proc/$$/fd',
      probeOutput: 'lrwx------ 1 root root 64 0 -> /dev/pts/0\nlrwx------ 1 root root 64 1 -> /dev/pts/0',
      caveat: 'In Linux, "Everything is a file". Hardware devices (/dev/sda), process info (/proc/1/cmdline), and sockets all expose themselves as files that can be opened and assigned a File Descriptor.',
      source: `${man}man7/inode.7.html`
    },
    {
      id: 'path',
      label: 'Path lookup',
      title: 'Directories are in-memory lookup maps; metadata lives in Inodes.',
      question: 'How does the Linux kernel translate a path string into disk sectors?',
      kind: 'path',
      actors: [
        { label: 'Pathname String', detail: 'Syntax: /srv/app/config' },
        { label: 'Dentry Cache (RAM)', detail: 'Fast hash table mapping names to Inode #262145' },
        { label: 'Inode Object', detail: 'Holds mode 0644, size, UID 33, and extent tree pointers' },
        { label: 'Page Cache (RAM)', detail: '4KB memory pages cached between VFS and device driver' }
      ],
      explanation: 'When a process invokes open(), the kernel Virtual File System (VFS) resolves the path by walking directory entries (dentries) component by component. Dentries are cached in RAM (dcache). The leaf dentry points to an Inode number. The Inode contains all file metadata (permissions, owner, size, timestamps) and an extent tree mapping logical file offsets to physical block sectors on the underlying block device.',
      takeaway: 'Filenames exist only inside directory data; all file properties and block locations live in the Inode.',
      command: 'stat /srv/app/config',
      output: '  File: /srv/app/config\n  Size: 4096      Blocks: 8          IO Block: 4096   regular file\nDevice: 259,1   Inode: 262145      Links: 1\nAccess: (0644/-rw-r--r--)  Uid: (33/www-data)   Gid: (33/www-data)',
      probe: 'ls -di /srv /srv/app /srv/app/config',
      probeOutput: '131072 /srv  262144 /srv/app  262145 /srv/app/config',
      caveat: 'The dentry cache (dcache) and inode cache are dynamically shrunk by kernel kswapd under memory pressure, which can cause sudden latency spikes if uncached lookups hit disk.',
      source: `${man}man7/inode.7.html`
    },
    {
      id: 'mount',
      label: 'Mount chain',
      title: 'Stitching independent filesystems into a single unified directory tree.',
      question: 'How do different disks and virtual filesystems connect under a single / root?',
      kind: 'layers',
      actors: [
        { label: 'Mount Point Dentry', detail: 'Target directory in host tree (e.g. /srv)' },
        { label: 'struct mount Object', detail: 'Kernel tracking node linking target dentry to root of new fs' },
        { label: 'Filesystem Driver', detail: 'ext4 / xfs driver translating VFS calls to block requests' },
        { label: 'Block Device', detail: 'Physical partition or cloud volume (e.g. /dev/vdb1)' }
      ],
      explanation: 'Linux exposes all storage devices under a single unified root directory (/). When mount() is invoked, the kernel creates a struct mount linking a target directory dentry to the root dentry of the mounted filesystem. Any previous files residing in the target directory become shadowed (hidden) until unmounted. The kernel VFS intercepts lookups crossing mount points and transparently switches to the child filesystem driver.',
      takeaway: 'Use findmnt to inspect the real mount hierarchy, filesystem types, and active mount flags.',
      command: 'findmnt /srv',
      output: 'TARGET SOURCE    FSTYPE OPTIONS\n/srv   /dev/vdb1 ext4   rw,relatime,errors=remount-ro',
      probe: 'lsblk -f /dev/vdb',
      probeOutput: 'NAME   FSTYPE FSVER LABEL UUID                                 FSAVAIL FSUSE% MOUNTPOINTS\nvdb\n└─vdb1 ext4   1.0         9b31d87e-45a1-432e-9d21-4f1122334455   48.2G     4% /srv',
      caveat: 'Containers use mount namespaces and bind mounts (mount --bind) to expose specific host directories or volumes inside container root filesystems.',
      source: `${man}man8/mount.8.html`
    },
    {
      id: 'file-types',
      label: 'File types & links',
      title: 'Inodes, hard links, and symlinks: understanding POSIX file semantics.',
      question: 'What is the structural difference between a hard link and a symbolic link?',
      kind: 'comparison',
      items: [
        { label: 'Regular File (-)', detail: 'Direct inode holding data block pointers via ext4 extent trees.', command: 'stat -c "%F %i %h" /srv/site/index.html', output: 'regular file 262145 1', highlight: 'neutral' },
        { label: 'Hard Link', detail: 'A second directory entry pointing to the EXACT same Inode number. Deleting one leaves data intact until nlink drops to 0.', command: 'stat -c "%i %h" /srv/site/index.html /srv/site/home.html', output: '262145 2\n262145 2  # Same inode!', highlight: 'good' },
        { label: 'Symbolic Link (l)', detail: 'An independent inode containing the target path string as data. Breaks if target is moved or deleted.', command: 'ls -l /srv/site/current', output: 'lrwxrwxrwx 1 root root 10 current -> index.html', highlight: 'neutral' },
        { label: 'Block Device (b)', detail: 'Kernel interface providing buffered random access to fixed-size blocks (NVMe, SSD).', command: 'ls -l /dev/vdb1', output: 'brw-rw---- 1 root disk 259, 1 /dev/vdb1', highlight: 'neutral' },
        { label: 'Character Device (c)', detail: 'Kernel interface providing unbuffered byte-stream access (TTYs, /dev/urandom).', command: 'ls -l /dev/urandom', output: 'crw-rw-rw- 1 root root 1, 9 /dev/urandom', highlight: 'neutral' }
      ],
      explanation: 'The first character of ls -l indicates the file type. A hard link creates an additional directory entry pointing to an existing inode, incrementing its link counter (nlink). Hard links cannot span across different filesystems because inode numbers are only unique within a single filesystem. In contrast, a symbolic link (symlink) is an independent file whose data payload is simply a path string pointing to another target.',
      takeaway: 'Hard links share an Inode and survive renaming; symlinks store a path string and break if the destination moves.',
      command: 'ls -la /tmp | head -n 4',
      output: 'drwxrwxrwt 15 root root 4096 Sep 18 19:40 .\ndrwxr-xr-x 19 root root 4096 Sep 18 12:00 ..\nsrwxrwxrwx  1 mysql mysql  0 Sep 18 12:05 mysql.sock\n-rw-------  1 root root  123 Sep 18 12:10 test.log',
      probe: 'stat -c "%F links:%h inode:%i" /srv/site/index.html',
      probeOutput: 'regular file links:1 inode:262145',
      caveat: 'Directories cannot have hard links created by user processes to prevent directory loops in the filesystem DAG.',
      source: `${man}man1/ls.1.html`
    },
    {
      id: 'space',
      label: 'Space vs inodes',
      title: 'Two independent exhaustion vectors: Data Blocks vs Inode Slots.',
      question: 'Why does a write fail with "No space left on device" when df -h shows 50% free?',
      kind: 'split',
      actors: [
        { label: 'Data Blocks (df -h)', detail: 'Physical storage sectors for file payloads (50% free)' },
        { label: 'Inode Slots (df -i)', detail: 'Fixed metadata table capacity (100% EXHAUSTED)' }
      ],
      failure: {
        label: 'Clean up stale session files',
        result: 'Deleting 500,000 stale session files reclaims inode slots; file creation succeeds immediately.',
        output: 'find /srv/sessions -type f -delete && df -i /srv\nFilesystem     Inodes   IUsed   IFree IUse% Mounted on\n/dev/vdb1     3276800  120400 3156400    4% /srv',
        blocked: 1,
        afterActors: [
          { label: 'Data Blocks (df -h)', detail: 'Physical storage sectors: 50% free' },
          { label: 'Inode Slots (df -i)', detail: 'Metadata slots: 4% used · 3.1M free' }
        ]
      },
      explanation: 'Filesystems like ext4 preallocate a fixed number of inodes during mkfs. Every file, directory, symlink, or socket consumes exactly one inode, regardless of file size. When an application generates millions of zero-byte or tiny files (e.g., PHP sessions, cache tokens, or build artifacts), all inode slots become consumed long before disk storage is full. The kernel returns ENOSPC (No space left on device) for any new touch or mkdir.',
      takeaway: 'Always run df -i alongside df -h when diagnosing mysterious disk-full alerts in production.',
      command: 'df -h /srv',
      output: 'Filesystem      Size  Used Avail Use% Mounted on\n/dev/vdb1        50G   25G   25G  50% /srv',
      probe: 'df -i /srv',
      probeOutput: 'Filesystem     Inodes   IUsed IFree IUse% Mounted on\n/dev/vdb1     3276800 3276800     0  100% /srv',
      caveat: 'Modern filesystems like XFS and Btrfs dynamically allocate inodes as needed and do not suffer from the rigid fixed-inode limitation of classic ext4.',
      source: `${man}man1/df.1.html`
    },
    {
      id: 'open-file',
      label: 'Deleted but open',
      title: 'The phantom disk leak: unlinked files held open by running processes.',
      question: 'Why does df still show 100% full after deleting a huge 20GB log file?',
      kind: 'interactive-vfs',
      vfsData: {
        dirPath: '/srv/log',
        filename: 'access.log',
        inodeNum: 262150,
        blocks: 5242880, // 20GB in 4K blocks
        processPid: 421,
        processComm: 'nginx',
        fd: 14
      },
      explanation: 'Linux separates directory entries from physical storage blocks using two distinct counters: the link count (i_nlink in the inode) and the open file descriptor count (f_count in the kernel). Running rm only unlinks the directory entry (setting nlink to 0). du inspects the directory hierarchy, so it will no longer find the file. However, because the daemon still has the file open, the kernel preserves the inode and disk blocks until the process closes the file descriptor or terminates.',
      takeaway: 'Never rm active log files; truncate them using : > file.log or reload the daemon to release the file handle.',
      command: 'lsof +L1 /srv',
      output: 'COMMAND   PID     USER   FD   TYPE DEVICE SIZE/OFF NLINK      NODE NAME\nnginx     421 www-data   14w   REG  259,1 21474836480     0    262150 /srv/log/access.log (deleted)',
      probe: 'truncate -s 0 /proc/421/fd/14',
      probeOutput: '# Space reclaimed instantly without restarting service: 20GB freed on /srv',
      caveat: 'If you already deleted the file path, you can reclaim space without restarting by truncating via procfs: : > /proc/<pid>/fd/<fd>.',
      source: `${man}man8/lsof.8.html`
    },
    {
      id: 'partitioning',
      label: 'Disk setup & fstab',
      title: 'From raw NVMe block device to persistent production mount.',
      question: 'How do you safely partition, format, and mount storage across host reboots?',
      kind: 'recipe',
      recipeSteps: [
        { step: 'Inspect raw block device topology', command: 'lsblk -o NAME,SIZE,TYPE,FSTYPE,MOUNTPOINT', output: 'vdb   50G disk\n└─vdb1 50G part /srv', note: 'Verify the device name and ensure it does not already contain an active filesystem.' },
        { step: 'Create GPT partition table and partition', command: 'sudo parted /dev/vdb --script mklabel gpt mkpart primary ext4 0% 100%', output: '# Partition 1 created spanning entire 50GB volume', note: 'GPT is standard for modern drives; parted is scriptable compared to interactive fdisk.' },
        { step: 'Format partition with ext4 filesystem', command: 'sudo mkfs.ext4 -L srv_data /dev/vdb1', output: 'Creating filesystem with 13107200 4k blocks\nAllocating group tables: done\nWriting inode tables: done', note: 'Allocates superblock, inode tables, and block groups.' },
        { step: 'Retrieve persistent device UUID', command: 'sudo blkid /dev/vdb1', output: '/dev/vdb1: UUID="9b31d87e-45a1-432e-9d21-4f1122334455" BLOCK_SIZE="4096" TYPE="ext4"', note: 'Always mount by UUID. Device names (/dev/vdb) can change across reboots or PCI reordering.' },
        { step: 'Configure persistent mount in /etc/fstab', command: 'echo "UUID=9b31d87e-45a1-432e-9d21-4f1122334455 /srv ext4 defaults,nofail 0 2" | sudo tee -a /etc/fstab', output: '# Persistent mount entry appended to /etc/fstab', note: 'The nofail option ensures the machine boots even if an external cloud volume fails to attach.' },
        { step: 'Validate fstab configuration without rebooting', command: 'sudo mount -a', output: '# Zero output indicates syntax and target directories are valid', note: 'ALWAYS run mount -a before rebooting. A broken /etc/fstab will drop the server into emergency mode.' }
      ],
      explanation: 'Storage provisioning follows five deterministic layers: raw block device → partition table (GPT) → filesystem structures (ext4/XFS) → target mount point dentry → /etc/fstab automation. Mounting by filesystem UUID eliminates catastrophic data corruption caused by non-deterministic device enumeration (e.g. /dev/sda becoming /dev/sdb).',
      takeaway: 'Always use UUID in /etc/fstab and test with mount -a before rebooting.',
      command: 'findmnt --fstab /srv',
      output: 'TARGET SOURCE                                    FSTYPE OPTIONS\n/srv   UUID=9b31d87e-45a1-432e-9d21-4f1122334455 ext4   defaults,nofail',
      probe: 'sudo blkid -s UUID -o value /dev/vdb1',
      probeOutput: '9b31d87e-45a1-432e-9d21-4f1122334455',
      caveat: 'Filesystem check order (the 6th field in fstab): 1 for root (/), 2 for other local drives, 0 to skip fsck (e.g. XFS or network mounts).',
      source: `${man}man5/fstab.5.html`
    },
    {
      id: 'volume',
      label: 'Cloud disk growth',
      title: 'Online volume expansion: hypervisor, partition table, and filesystem.',
      question: 'Why does df still show the old size after expanding an EBS/cloud volume?',
      kind: 'recipe',
      recipeSteps: [
        { step: 'Expand virtual disk in cloud console/API', command: 'aws ec2 modify-volume --volume-id vol-12345 --size 100', output: '{\n  "VolumeModification": { "TargetSize": 100, "Progress": 0, "ModificationState": "modifying" }\n}', note: 'The cloud hypervisor expands the backing virtual block device without unmounting.' },
        { step: 'Verify kernel sees larger block device', command: 'lsblk /dev/vdb', output: 'NAME   MAJ:MIN RM  SIZE RO TYPE MOUNTPOINTS\nvdb    259:0    0  100G  0 disk \n└─vdb1 259:1    0   50G  0 part /srv', note: 'Notice: disk is 100G, but partition vdb1 is still 50G. The OS does not auto-grow partitions.' },
        { step: 'Expand the partition boundary', command: 'sudo growpart /dev/vdb 1', output: 'CHANGED: partition=1 start=2048 old: size=104855552 end=104857600 new: size=209713119 end=209715167', note: 'Rewrites GPT/MBR partition table in memory and on disk to claim remaining contiguous sectors.' },
        { step: 'Online resize the ext4 filesystem', command: 'sudo resize2fs /dev/vdb1', output: 'resize2fs 1.46.5\nFilesystem at /dev/vdb1 is mounted on /srv; on-line resizing required\nold_desc_blocks = 7, new_desc_blocks = 13\nThe filesystem on /dev/vdb1 is now 26214139 (4k) blocks long.', note: 'Expands filesystem superblock, block groups, and allocation bitmaps live while mounted (use xfs_growfs for XFS).' },
        { step: 'Verify reclaimed space in user space', command: 'df -h /srv', output: 'Filesystem      Size  Used Avail Use% Mounted on\n/dev/vdb1        99G   25G   74G  25% /srv', note: 'All newly provisioned 50GB storage is now immediately available to applications.' }
      ],
      explanation: 'Expanding storage requires notifying three distinct layers in order: 1. Cloud hypervisor increases block device size; 2. Partition table is expanded via growpart to encompass the new sector range; 3. Filesystem driver is instructed via resize2fs or xfs_growfs to extend its block groups and superblocks across the newly available partition space.',
      takeaway: 'Volume expansion requires 3 manual steps: Cloud size → growpart (partition) → resize2fs/xfs_growfs (filesystem).',
      command: 'df -h /srv',
      output: 'Filesystem      Size  Used Avail Use% Mounted on\n/dev/vdb1        99G   25G   74G  25% /srv',
      probe: 'lsblk -o NAME,SIZE,MOUNTPOINT /dev/vdb',
      probeOutput: 'NAME   SIZE MOUNTPOINT\nvdb    100G \n└─vdb1 100G /srv',
      caveat: 'NVMe devices on newer EC2 instances use names like /dev/nvme1n1p1. growpart syntax requires a space before partition number: sudo growpart /dev/nvme1n1 1.',
      source: `${man}man8/resize2fs.8.html`
    }
  ]
};
