## Public SSL certificates for *.opentreeoflife.org

**Needless to say, this does _not_ include private keys!**

These files are included here mainly for convenience during deployment.
NameCheap normally provides a full chain of SSL certs, from our wildcard for
`*.opentreeoflife.org` to the COMODO root certificate. 

Sadly, this is not enough to easily build trust with some clients, so we use
the `resolve.sh` script ([found here](https://github.com/zan/cert-chain-resolver), 
thanks [@zakjan](https://github.com/zan)!) to fetch and append all intermediate
certificates in the chain:
```bash
 $ ./resolve.sh STAR_opentreeoflife_org.crt STAR_opentreeoflife_org.pem
```
Note that this script requires `wget` or `curl`, as well as `openssl` to run.

The result is a new file `STAR_opentreeoflife_org.pem`. This includes the full
chain of public certificates, and it's the file we actually specify in our
apache configuration file `001-opentree-ssl`. (See
[template](https://github.com/OpenTreeOfLife/opentree/blob/master/deploy/setup/apache-config-vhost-ssl)
and 
[installation script](https://github.com/OpenTreeOfLife/opentree/blob/master/deploy/restart-apache.sh)
for details.)

Since this combined certificate file is all we need, I'm leaving the other
.crt files out of version control to reduce clutter here.

**REMINDER**: that we'll occasionally need to replace the `.crt` file here, so
it's vital that in that case we re-run `resolve.sh` as described above to
generate the new `.pem` file.


