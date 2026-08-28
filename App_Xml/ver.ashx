<%@ WebHandler Language="C#" Class="ver" %>

using System;
using System.Web;
using System.Xml;
using System.Data;
using System.Text;

public class ver : IHttpHandler {
    
    public void ProcessRequest (HttpContext context) {


        //清除該頁輸出緩存，設置該頁無緩存   
        context.Response.Buffer = true;
        context.Response.ExpiresAbsolute = System.DateTime.Now.AddMilliseconds(0);
        context.Response.Expires = 0;
        context.Response.CacheControl = "no-cache";
        context.Response.AppendHeader("Pragma", "No-Cache");

        context.Response.ContentType = "application/xml";

        ez.function f = new ez.function();
        
        ez.admin.configuration configuration = new ez.admin.configuration();
    
        System.Xml.XmlTextWriter objX = new System.Xml.XmlTextWriter(context.Response.OutputStream,  Encoding.UTF8);
        objX.WriteStartDocument();
        objX.WriteStartElement("System");

        objX.WriteStartElement("WebInfo");
        objX.WriteElementString("Grade", configuration.Grade());
        string BuySystem = "";
        ez.admin.configuration.Modules cModules = new ez.admin.configuration.Modules();
        DataTable mDt = cModules.List();
        foreach (DataRow mRow in mDt.Rows)
        {
            BuySystem += (!f.isStrNull(BuySystem) ? "、" : "") + f.ValString(mRow["module"]).Replace("模組", "系統");
        }
        objX.WriteElementString("BuySystem", BuySystem);
        objX.WriteEndElement();

        DataTable dt = configuration.ModuleVerList();
        foreach (DataRow row in dt.Rows)
        {
            objX.WriteStartElement("Row");
            objX.WriteElementString("Module", f.ValString(row["Module"]));
            objX.WriteElementString("Ver", f.ValString(row["Ver"]));
            objX.WriteElementString("Path", f.ValString(row["Path"]));
            objX.WriteEndElement();
        }        

        objX.WriteEndElement();
        objX.WriteEndDocument();
        objX.Flush();
        objX.Close();
        context.Response.End();
            
    }
 
    public bool IsReusable {
        get {
            return false;
        }
    }

}