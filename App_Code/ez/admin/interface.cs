///1.15.0225@後台Interface模組
///
public interface MasterToAdminIndex
{
    void setDesignMode(bool inMode); 
}

public interface MasterToAdminIndex2
{
    void setWrpInfo(string WrpApiUrl, string WrpApiClient);
}

public interface BasePageToMaster
{
    void loginStatusGet(ez.admin.user.loginInfoType _loginInfo);
    void MasteBodyClass(string className);
}

public interface MasterToUC
{
    void loginStatusGet(ez.admin.user.loginInfoType _loginInfo);
    void WebSetGet(ez.data.info.DataInfo _webInfo);
}


