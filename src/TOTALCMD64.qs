<?xml version="1.0" encoding="utf-8" ?>
<!-- Total Commander JAWS scripts: Quick Settings (Insert+V). The language list is stored as
     its position (0, 1...) in TOTALCMD64.jcf, [NonJCFOptions] TcLanguage; the scripts map it
     to a language code in the same order (tcLanguages in TOTALCMD64.jsh). -->
<QuickSettings>
	<QuickSettingsDefinitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
		<Category ID="TcSettings">
			<Setting ID="TcSettings.Language" Type="List">
				<Values>
					<Value ID="TcSettings.Language.en"/>
					<Value ID="TcSettings.Language.cs"/>
					<Value ID="TcSettings.Language.da"/>
					<Value ID="TcSettings.Language.de"/>
					<Value ID="TcSettings.Language.es"/>
					<Value ID="TcSettings.Language.fr"/>
					<Value ID="TcSettings.Language.hr"/>
					<Value ID="TcSettings.Language.it"/>
					<Value ID="TcSettings.Language.hu"/>
					<Value ID="TcSettings.Language.nl"/>
					<Value ID="TcSettings.Language.nb"/>
					<Value ID="TcSettings.Language.pl"/>
					<Value ID="TcSettings.Language.ro"/>
					<Value ID="TcSettings.Language.sk"/>
					<Value ID="TcSettings.Language.sl"/>
					<Value ID="TcSettings.Language.sr"/>
					<Value ID="TcSettings.Language.sv"/>
					<Value ID="TcSettings.Language.ru"/>
					<Value ID="TcSettings.Language.uk"/>
					<Value ID="TcSettings.Language.ko"/>
					<Value ID="TcSettings.Language.zh"/>
				</Values>
				<SettingsFile Section="NonJCFOptions" Name="TcLanguage"/>
			</Setting>
			<Setting ID="TcSettings.SelectKey" Type="List">
				<Values>
					<Value ID="TcSettings.SelectKey.ext"/>
					<Value ID="TcSettings.SelectKey.num"/>
					<Value ID="TcSettings.SelectKey.both"/>
					<Value ID="TcSettings.SelectKey.none"/>
				</Values>
				<!-- Usage follows the choice while Quick Settings is open -->
				<Dependents>
					<Dependent ID="TcSettings.SelectUsage"/>
				</Dependents>
				<SettingsFile Section="NonJCFOptions" Name="TcSelectKey"/>
			</Setting>
			<!-- Usage: "Inactive" while Selection key is "Both" or "None"; the scripts set it
			     when Selection key changes (TcUsageDependeeChanged, TOTALCMD64_settings.jss) -->
			<Setting ID="TcSettings.SelectUsage" Type="List">
				<Values>
					<Value ID="TcSettings.SelectUsage.single"/>
					<Value ID="TcSettings.SelectUsage.double"/>
					<Value ID="TcSettings.SelectUsage.inactive"/>
				</Values>
				<SettingsFile Section="NonJCFOptions" Name="TcSelectUsage"
					OnDependeeChangedEvent="TcUsageDependeeChanged"/>
			</Setting>
		</Category>
	</QuickSettingsDefinitions>
</QuickSettings>