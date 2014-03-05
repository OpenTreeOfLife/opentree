#!/usr/bin/env python
"""Launches a job in the specified directory and uses the .process_metadata 
subdirectory of that directory to record the status, pid, and returncode of the process

Invocation of this script:
    joblauncher.py <working dir> <path to stdin redirection or ''> <name_for_stdout> <name_for_stderr> <invocation word 1> <invocation word 2> ... 

For example, the invocation:
    joblauncher.py wd in out err cmd arg1 arg2 arg3
would do the equivalent of  the shell script
################################################################################
cd wd
cmd arg1 arg2 arg3 < in >out 2>err
################################################################################


In addition to running the command and performing the redirection the script 
creates the following directory structure (where wd is the working dir specified
as the first argument):

wd/.process_metadata
wd/.process_metadata/env            - python repr of os.environ
wd/.process_metadata/invocation     - the invocation used
wd/.process_metadata/launcher_pid   - pid of joblauncher.py instance
wd/.process_metadata/pid            - pid of launched process. This file will be
                                        absent if the launch fails (in this case
                                        the stderr file will contain a message
                                        from joblauncher.py).
wd/.process_metadata/stdioe         - A file with 3 lines. the file paths to 
                                        stdin, stdout, and stderr (the 
                                        joblauncher.py script's second through 
                                        fourth arguments)
wd/.process_metadata/status         - will contain one of the following strings:
                                        "NOT_LAUNCHED",
                                        "NOT_LAUNCHABLE",
                                        "RUNNING",
                                        "ERROR_EXIT", or
                                        "COMPLETED"
If the process completes then:
wd/.process_metadata/returncode     - holds the returncode of the launched
                                        process. If the launching fails, then
                                        this file will hold -1
"""
class RStatus:
    NOT_LAUNCHED, NOT_LAUNCHABLE, RUNNING, ERROR_EXIT, COMPLETED, DELETED = range(6)
    def to_str(x):
        return ["NOT_LAUNCHED", "NOT_LAUNCHABLE", "RUNNING", "ERROR_EXIT", "COMPLETED", "DELETED"][x]
    to_str = staticmethod(to_str)

if __name__ == '__main__':
    import sys
    import subprocess
    import os

    def open_metadata_file(d, fn, mode):
        fp = os.path.join(d, fn)
        return open(fp, mode)

    def flag_status(d, s):
        write_metadata(d, "status", "%s\n" % RStatus.to_str(s))

    def write_metadata(d, fn, content):
        o = open_metadata_file(d, fn, 'w')
        try:
            o.write(content)
        finally:
            o.close()

    def shell_escape_arg(s):
        return "\\ ".join(s.split()) 
    if len(sys.argv) < 6 or (len(sys.argv) > 1 and sys.argv[1] == '-h'):
        sys.exit("""Expecting arguments the following arguments:
      path_to_parent_dir file_with_stdin name_for_stdout name_for_stderr
    followed by the command to invoke.
    """)

    wd = sys.argv[1]
    os.chdir(wd)
    stdinpath = sys.argv[2]
    stdoutpath = sys.argv[3]
    stderrpath = sys.argv[4]

    in_obj = stdinpath and open(stdinpath, 'rU') or None
    assert stdoutpath
    assert stderrpath
    outf = open(stdoutpath, "w")
    errf = open(stderrpath, "w")
    invocation = sys.argv[5:]


    metadata_dir = ".process_metadata"
    if not os.path.exists(metadata_dir):
        os.mkdir(metadata_dir)

    escaped_invoc = ' '.join([shell_escape_arg(i) for i in invocation])
    write_metadata(metadata_dir, "invocation", "{i}\n".format(i=escaped_invoc))
    try:
        write_metadata(metadata_dir, "launcher_pid", "{p:d}\n".format(e=os.getpid()))
        write_metadata(metadata_dir, "env", "{e:r}\n".format(e=os.environ))
        write_metadata(metadata_dir, "stdioe", "{i}\n{o}\n{e}}\n".format(i=stdinpath, 
                                                                         o=stdoutpath,
                                                                         e=stderrpath))
    except:
        pass
    flag_status(metadata_dir, RStatus.NOT_LAUNCHED)
    try:
        #print invocation
        proc = subprocess.Popen(invocation, stdin=subprocess.PIPE, stdout=outf, stderr=errf)
        flag_status(metadata_dir, RStatus.RUNNING)
    except:
        raise
        errf.write("Creation of subprocess failed\n")
        write_metadata(metadata_dir, "returncode", "-1\n")
        flag_status(metadata_dir, RStatus.NOT_LAUNCHABLE)
        sys.exit(-1)
        
    write_metadata(metadata_dir, "pid", "{p:d}\n".format(p=proc.pid))
    if in_obj:
        proc.stdin.write(in_obj.read())
    proc.stdin.close()
    proc.wait()
    rc = proc.returncode
    write_metadata(metadata_dir, "returncode","{r:d}\n".format(r=rc))
    if rc == 0:
        flag_status(metadata_dir, RStatus.COMPLETED)
    else:
        flag_status(metadata_dir, RStatus.ERROR_EXIT)

    outf.close()
    errf.close()
    sys.exit(rc)
