using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using ez.data;
using System.Data;

public partial class eZThemeCustom : ez.web.controls.ControlBase
{

    public string LogoPath = "";
    public string LogoWidth = "";
    public string LogoHeight = "";
    public string LogoStyle = "";
    public string[] template_bg = { "", "", "", "" };
    public string[] template_repeat = { "", "", "", "" };
    public string frame_top = "";
    public string frame_left = "";
    public string frame_zindex = "";
    public string frame_display = "";

    protected void Page_Load(object sender, EventArgs e)
    {
        //GET_LOGO();
        GET_BG();
        Framesets_Load();
    }


    #region LOGO

    protected string GET_LOGO()
    {
        string r="";
        string path = p.WebSet.Dir + "/" + p.WebSet.Data.logo;
        System.Drawing.Image image;
        path = path.Replace("//", "/");
        if (System.IO.File.Exists(Server.MapPath(path)))
        {
            LogoPath = ResolveUrl(path);
            image = System.Drawing.Image.FromFile(Server.MapPath(path));
            LogoWidth = image.Width.ToString()+ " px";
            LogoHeight = image.Height.ToString() + " px";
            /*
            background-image: url(<%=LogoPath%>);
            width: <%=LogoWidth%>;  
            height: <%=LogoHeight%>;
            */
            r = "background-image: url(" + LogoPath+ ");" +
                "width: " + LogoWidth + ";" +
                "height: " + LogoHeight + ";";
        }
        return r;
    }

    #endregion

    #region Background

    protected void GET_BG()
    {
        string[] mTemp = this.Page.MasterPageFile.Split('/');
        string tn = mTemp[mTemp.Length - 2];
        string[] bgimg = { "template_" + tn + "_hbg", "template_" + tn + "_bg", "template_" + tn + "_htbg", "template_" + tn + "_tbg" };
        configExtend c = new configExtend("template");
        DataTable dt = c.GetSetView(bgimg);
        if (dt.Rows.Count > 0)
        {
            template template = new template();
            DataRow row = dt.Rows[0];
            for (int i = 0; i < bgimg.Length; i++)
            {
                string bg = p.ValString(row[bgimg[i]]);
                if (!p.isStrNull(bg))
                {
                    template_bg[i] = "background-image: url(" + ResolveUrl(template.Dir + bg) + "); ";
                }
            }
        }
        string[] bgrepeat = { "template_" + tn + "_hrepeat", "template_" + tn + "_repeat", "template_" + tn + "_htrepeat", "template_" + tn + "_trepeat" };
        c = new configExtend("template");
        dt = c.GetSetView(bgrepeat);
        if (dt.Rows.Count > 0)
        {
            DataRow row = dt.Rows[0];
            for (int i = 0; i < bgrepeat.Length; i++)
            {
                string repeat = p.ValString(row[bgrepeat[i]]);
                if (!p.isStrNull(repeat))
                {
                    template_repeat[i] = "background-repeat:" + repeat + ";";
                }
            }
        }
    }
    

    #endregion

    #region 節慶主題

    protected void Framesets_Load()
    {

        framesets framesets = new ez.data.framesets();
        framesets.Load();
        framesets.ConfigInfo t = framesets.Config;
        string tn = t.wrpCssID;
        string[] frame = { "frame_" + tn + "_top", "frame_" + tn + "_left", "frame_" + tn + "_zindex", "frame_" + tn + "_display" };
        configExtend c = new configExtend("frame");
        DataTable dt = c.GetSetView(frame);
        if (dt.Rows.Count > 0)
        {
            DataRow row = dt.Rows[0];
            frame_top = p.ValString(row[frame[0]]);
            frame_left = p.ValString(row[frame[1]]);
            frame_zindex = p.ValString(row[frame[2]]);
            frame_display = p.ValString(row[frame[3]]);
        }

        if (!p.isStrNull(frame_top)) {
            frame_top = "top: " + frame_top + "px;";
        }
        else
        {
            frame_top = "";
        }
        if (!p.isStrNull(frame_left)) {
            frame_left = "margin-left: " + frame_left + "px;";
        }else {
            frame_left = "";
        }
        if (!p.isStrNull(frame_display)) {
            frame_display = "display: " + frame_display;
        } else {
            frame_display = "";
        }
    }

    #endregion
}