<%@ WebHandler Language="C#" Class="recovery" %>

using System;
using System.Web;
using System.IO;


public class recovery : IHttpHandler {

    public void ProcessRequest (HttpContext context) {
        context.Response.ContentType = "text/plain";

        DirectoryInfo source = new DirectoryInfo( HttpContext.Current.Server.MapPath("~/_recovery"));
        if (source.Exists)
        {
            try
            {
                ClearDirs(source.GetDirectories());
                CopyFiles(source.GetFiles());
                CopyDirs(source.GetDirectories());
                context.Response.Write("還原成功");
            }
            catch (Exception ex)
            {
                context.Response.Write(ex.Message);
            }
        }
        else
        {
            context.Response.Write("還原檔不存在");
        }


    }

    public void ClearDirs(DirectoryInfo[] sd)
    {
        if (sd.Length > 0)
        {
            foreach (DirectoryInfo d in sd)
            {

                if (d.FullName.IndexOf("\\_recovery")>-1)
                {
                    DirectoryInfo d2 = new DirectoryInfo(d.FullName.Replace("\\_recovery", ""));
                    if (d2.Exists)
                    {
                        ClearFiles(d2.GetFiles());
                        ClearDirs(d2.GetDirectories());
                        //d2 不刪資料夾，為第1層資料夾，以免造成資料夾權限重設                     
                    }
                }
                else
                {
                    ClearFiles(d.GetFiles());
                    ClearDirs(d.GetDirectories());
                    d.Delete();
                }
            }
        }
    }

    public void ClearFiles(FileInfo[] sf)
    {
        if (sf.Length > 0)
        {
            foreach (FileInfo f in sf)  {   f.Delete(); }
        }
    }

    public void CopyFiles(FileInfo[] sf)
    {
        if (sf.Length > 0)
        {
            foreach (FileInfo f in sf)
            {
                f.CopyTo(f.FullName.Replace("\\_recovery", ""), true);
            }
        }
    }

    public void CopyDirs(DirectoryInfo[] sd)
    {
        if (sd.Length > 0)
        {
            foreach (DirectoryInfo d in sd)
            {
                DirectoryInfo d2 = new DirectoryInfo(d.FullName.Replace("\\_recovery", ""));
                if (!d2.Exists)    {   d2.Create();   }
                CopyFiles(d.GetFiles());
                CopyDirs(d.GetDirectories());
            }
        }
    }

    public bool IsReusable {
        get {
            return false;
        }
    }

}