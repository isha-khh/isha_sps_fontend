using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using ez.data;

public partial class admin_uc_seo : System.Web.UI.UserControl
{

    ez.function _f = new ez.function();

    protected void Page_Load(object sender, EventArgs e)
    {
        if (!IsPostBack)
        {
            phc_Panel.Visible = (this.NumValue == "0") ? false : true;
        }
    }

    public string NumValue
    {
        get { return num.Value; }
        set { num.Value = value; }
    }
    public string CategoryValue
    {
        get { return category.Value; }
        set { category.Value = value; }
    }
    public string seoTitle
    {
        get { return _seoTitle.Text; }
        set { _seoTitle.Text = value; }
    }


    public void Load()
    {
        title.Value = keyword.Value = description.Text = page_head_code.Text = "";

        seo seo = new seo(CategoryValue);
        if (seo.Load(_f.Val(NumValue)))
        {
            title.Value = seo.Data.title;
            keyword.Value = seo.Data.keyword;
            description.Text = seo.Data.description;
            page_head_code.Text = seo.Data.page_head_code;
        }
        else if (!_f.isStrNull(seo.log))
        {
            Response.Write("SEO_UC ERROR：" + seo.log);
        }
    }

    private seo.DataInfo getData()
    {
        seo.DataInfo Data = new seo.DataInfo();
        Data.num = _f.Val(NumValue);
        Data.title = title.Value;
        Data.keyword = keyword.Value;
        Data.description = description.Text;
        Data.page_head_code = page_head_code.Text;
        return Data;
    }

    public void Save()
    {
        seo seo = new seo(CategoryValue);
        seo.Data = getData();
        if (!seo.Save())
        {
            Response.Write("SEO_UC ERROR：" + seo.log);
        }
    }

    public void Del()
    {
        seo seo = new seo(CategoryValue);
        if (!seo.Del(_f.Val(NumValue)))
        {
            Response.Write("SEO_UC ERROR：" + seo.log);
        }
    }

}