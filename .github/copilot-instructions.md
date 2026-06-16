# JMRT2 Copilot Instructions

> See `.github/instructions/` for language-specific standards (C/Java/SQL/Shell) and `.github/prompts/` for reusable task prompts.

## Big picture
- JMRT2 is a railway PA system with three core components:
	- **CCCS App Svr (C)**: central control at `CCCS App Svr/source/`.
	- **SCCS App Svr (C)**: station control at `SCCS App Svr/source/`.
	- **Web Svr (Java/Spring)**: control UI in `Web Svr/` (multi-module Maven).
- Data flow: `Web UI → Protobuf/TCP → CCCS → socket → SCCS → Asterisk SIP → speakers`.
- Protobuf schema lives in `SCCS App Svr/source/core/include/tccs_comm.proto` and generates `tccs_comm.pb-c.*` and Java `TccsCommDataFactory`.

## Key directories & entry points
- CCCS main: `CCCS App Svr/source/core/src/cccs.c`.
- SCCS main: `SCCS App Svr/source/core/src/sccs.c`.
- Shared C libs: `*/source/lib/` with `tccs_`-prefixed wrappers (log/memory/socket/io/snmp).
- Web modules: `Web Svr/cccs-ccp` (WAR UI), `cccs-core` (services), `cccs-dbmanager` (Hibernate), `tccs-comm` (protobuf).
- DB schemas: `CCCS App Svr/config/jmrt_cccs.sql`, `CCCS App Svr/config/jmrt_asterisk_cccs.sql`, `SCCS App Svr/config/jmrt_sccs.sql`.

## Build & test workflows
- C servers (Linux): from `CCCS App Svr/source/` or `SCCS App Svr/source/` run `make` (and `make dist` for SCCS install).
- C unit tests (Linux): `CCCS App Svr/unit_test/` → `make`, then `./gtest_main` (Google Test at `/home/jmrt10/jmrt/software/gtest`).
- Web server (Windows/Linux): from `Web Svr/` run `build.cmd` or `mvn clean package -Dmaven.test.skip=true` (JDK 1.8).
- RPM build (Linux): `./build_prepare.sh <BUILD_DIR> <VERSION> <REVISION>`.

## Project-specific conventions
- C naming: `cccs_*.c/h`, `sccs_*.c/h`, `tccs_*.c/h`; header guards `__FILENAME_H__`.
- Use wrapper libs (`tccs_loglib`, `tccs_mmlib`, `tccs_socketlib`, `tccs_iolib`, `tccs_snmplib`) instead of direct system calls.
- Java packages use `com.nec.jp.tccs.cccs.*` with Spring `@Service/@Autowired` and Hibernate entities in `cccs-dbmanager`.
- Shell scripts live in `CCCS App Svr/source/scripts/` and `SCCS App Svr/scripts/` with `cccs_`/`sccs_` prefixes.

## Integration points
- Databases: PostgreSQL 16 via libpq/ODBC; main DBs are `cccs` and `asterisk`.
- SCCS↔Web comms use Protobuf over TCP (`ProtobufData` in Java, protobuf-c in C).
- Asterisk integration for SIP/PA audio (see `PASC/` for Unix socket SIP event reporting).

## Quick references
- Prompts: `/build-c-servers`, `/build-web-server`, `/run-unit-tests`, `/build-rpm-packages`, `/update-protobuf-schema`.
- Production paths: `/opt/nec/tccs/app_server/` for binaries/config, logs under `/var/log/cccs/`.
